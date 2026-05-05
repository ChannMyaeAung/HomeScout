import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getLeases = async (req: Request, res: Response): Promise<void> => {
  try {
    const leases = await prisma.lease.findMany({
      include: {
        tenant: true, // Include tenant details in the response
        property: true, // Include property details in the response
      },
    });

    res.json(leases);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching leases", error: error.message });
  }
};

export const getLeasePayments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const payments = await prisma.payment.findMany({
      where: { leaseId: Number(id) },
    });

    res.json(payments);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching lease payments", error: error.message });
  }
};
