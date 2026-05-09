import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const listApplications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userId, userType } = req.query;

    // Both tenant and manager share this endpoint — the where clause changes
    // based on who is asking. Tenant sees their own applications; manager sees
    // applications for properties they own (requires a nested relation filter).
    let whereClause = {};
    if (userId && userType) {
      if (userType === "tenant") {
        whereClause = { tenantCognitoId: String(userId) };
      } else if (userType === "manager") {
        // Filter through two relation hops: Application → Property → Manager
        whereClause = { property: { manager: { cognitoId: String(userId) } } };
      }
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            location: true, // needed to surface the address on each application
            manager: true, // needed so the tenant can see who manages the property
          },
        },
        tenant: true,
      },
    });

    // Walks forward from a lease's start date month by month until it lands
    // on a future date that is the next payment due.
    function calculateNextPaymentDate(startDate: Date): Date {
      const today = new Date();
      const nextPaymentDate = new Date(startDate);
      while (nextPaymentDate <= today) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
      return nextPaymentDate;
    }

    // Each application needs its active lease attached so the UI can show
    // payment info. This is another N+1 pattern — one lease query per application.
    const formattedApplications = await Promise.all(
      applications.map(async (app) => {
        // A tenant may have had multiple leases on the same property (e.g. renewed).
        // orderBy desc + findFirst gives us the most recent one.
        const lease = await prisma.lease.findFirst({
          where: {
            tenant: { cognitoId: app.tenantCognitoId },
            propertyId: app.propertyId,
          },
          orderBy: { startDate: "desc" },
        });

        return {
          ...app,
          property: {
            ...app.property,
            // Hoist address to the property level so the client doesn't need to
            // reach into property.location.address every time.
            address: app.property.location.address,
          },
          // Hoist manager to the top level for the same reason.
          manager: app.property.manager,
          lease: lease
            ? {
                ...lease,
                nextPaymentDate: calculateNextPaymentDate(lease.startDate),
              }
            : null,
        };
      }),
    );

    res.json(formattedApplications);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching applications", error: error.message });
  }
};

export const createApplication = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      applicationDate,
      status,
      propertyId,
      tenantCognitoId,
      name,
      email,
      phoneNumber,
      message,
    } = req.body;

    // select fetches only the two columns needed for the lease
    // avoids pulling
    // photo URL arrays and other wide fields from a potentially large row.
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { pricePerMonth: true, securityDeposit: true },
    });

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    // Both writes are wrapped in a transaction so they succeed or fail together.
    // A lease with no application (or vice-versa) would leave orphaned rows that
    // are hard to reconcile later.
    const newApplication = await prisma.$transaction(async (prisma) => {
      // Lease must be created first — the application row holds a leaseId FK,
      // so connect: { id: lease.id } below requires the lease to exist already.
      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          // setFullYear handles month/day edge cases (e.g. leap day) correctly.
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1),
          ),
          rent: property.pricePerMonth,
          deposit: property.securityDeposit,
          property: { connect: { id: propertyId } },
          tenant: { connect: { cognitoId: tenantCognitoId } },
        },
      });

      const application = await prisma.application.create({
        data: {
          applicationDate: new Date(applicationDate),
          status,
          name,
          email,
          phoneNumber,
          message,
          property: { connect: { id: propertyId } },
          tenant: { connect: { cognitoId: tenantCognitoId } },
          // Link to the lease created above — no new record, just writes the FK.
          lease: { connect: { id: lease.id } },
        },
        // Return the full related objects so the client doesn't need follow-up requests.
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });
      return application;
    });

    res.status(201).json(newApplication);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating application", error: error.message });
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log("status: ", status);

    const application = await prisma.application.findUnique({
      where: { id: Number(id) },
      include: { property: true, tenant: true },
    });

    if (!application) {
      res.status(404).json({ message: "Application not found" });
      return;
    }

    if (status === "Approved") {
      const newLease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(new Date().getFullYear() + 1),
          rent: application.property.pricePerMonth,
          deposit: application.property.securityDeposit,
          propertyId: application.propertyId,
          tenantCognitoId: application.tenantCognitoId,
        },
      });

      // Update the property to connect the tenant
      await prisma.property.update({
        where: { id: application.propertyId },
        data: {
          tenants: {
            connect: { cognitoId: application.tenantCognitoId },
          },
        },
      });

      // Update the application with the new lease ID
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status, leaseId: newLease.id },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });
    } else {
      // Update the application status (for both "Denied" and other statuses)
      await prisma.application.update({
        where: { id: Number(id) },
        data: { status },
      });

      // Respond with the updated application details
      const updatedApplication = await prisma.application.findUnique({
        where: { id: Number(id) },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });

      res.json(updatedApplication);
    }
  } catch (error: any) {
    res.status(500).json({
      message: "Error updating application status",
      error: error.message,
    });
  }
};
