import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { wktToGeoJSON } from "@terraformer/wkt";
export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: {
        favorites: true,
      },
    });
    if (tenant) {
      res.json(tenant);
    } else {
      res.status(404).json({ message: "Tenant not found" });
    }
  } catch (error: any) {
    console.error("getTenant error:", error);
    res
      .status(500)
      .json({ message: "Error fetching tenant", error: error.message });
  }
};

export const createTenant = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { cognitoId, name, email, phoneNumber } = req.body;

    const tenant = await prisma.tenant.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
      },
    });
    res.status(201).json(tenant);
  } catch (error: any) {
    console.error("createTenant error:", error);
    res
      .status(500)
      .json({ message: "Error creating tenant", error: error.message });
  }
};

export const updateTenant = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }
    const { name, email, phoneNumber } = req.body;

    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updatedTenant);
  } catch (error: any) {
    console.error("updateTenant error:", error);
    res
      .status(500)
      .json({ message: "Error updating tenant", error: error.message });
  }
};

export const getCurrentResidences = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }

    // Fetch properties where the tenant is currently residing
    // some is used to check if the tenant is part of the tenants array in the property
    const properties = await prisma.property.findMany({
      where: { tenants: { some: { cognitoId } } },
      include: {
        location: true,
      },
    });

    const residenceWithFormattedLocation = await Promise.all(
      properties.map(async (property) => {
        const coordinates: { coordinates: string }[] =
          await prisma.$queryRaw`SELECT St_AsText(coordinates) as coordinates FROM "Location" WHERE id = ${property.locationId}`;
        const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");

        return {
          ...property,
          location: {
            ...property.location,
            coordinates: {
              longitude: geoJSON.coordinates[0],
              latitude: geoJSON.coordinates[1],
            },
          },
        };
      }),
    );

    res.json(residenceWithFormattedLocation);
  } catch (error: any) {
    res.status(500).json({
      message: "Error fetching current residences",
      error: error.message,
    });
  }
};

export const addFavoriteProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }

    const { propertyId } = req.params;
    const propertyIdNumber = Number(propertyId);

    // Fetch existing favorites so we can do a duplicate check in memory.
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: { favorites: true },
    });

    const existingFavorites = tenant?.favorites ?? [];

    // Array.some() returns true as soon as it finds one element that matches the
    // condition — here, "does any saved favorite already have this propertyId?"
    // Checking before the write lets us return a clean 409 Conflict instead of
    // letting a DB constraint violation bubble up as a raw 500 error.
    if (existingFavorites.some((fav) => fav.id === propertyIdNumber)) {
      res.status(409).json({ message: "Property already in favorites" });
      return;
    }

    // `connect` is Prisma's API for linking two existing records in a many-to-many
    // relation. It does NOT create a new Property — it inserts one row into the
    // hidden join table (_TenantFavorites) that maps this tenant to that property.
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        favorites: {
          connect: { id: propertyIdNumber },
        },
      },
      include: { favorites: true },
    });

    res.json(updatedTenant);
  } catch (error: any) {
    res.status(500).json({
      message: "Error adding favorite property",
      error: error.message,
    });
  }
};

export const removeFavoriteProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }

    const { propertyId } = req.params;
    const propertyIdNumber = Number(propertyId);

    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        favorites: {
          disconnect: { id: propertyIdNumber },
        },
      },
      include: { favorites: true },
    });

    res.json(updatedTenant);
  } catch (error: any) {
    res.status(500).json({
      message: "Error removing favorite property",
      error: error.message,
    });
  }
};
