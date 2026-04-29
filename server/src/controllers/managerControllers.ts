import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const getManager = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }
    const manager = await prisma.manager.findUnique({
      where: { cognitoId },
    });

    if (manager) {
      res.json(manager);
    } else {
      res.status(404).json({ message: "Manager not found" });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching manager", error: error.message });
  }
};

export const createManager = async (
  res: Response,
  req: Request,
): Promise<void> => {
  try {
    const { cognitoId, name, email, phoneNumber } = req.body;
    const manager = await prisma.manager.create({
      data: {
        cognitoId,
        name,
        email,
        phoneNumber,
      },
    });

    res.status(201).json(manager);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating manager", error: error.message });
  }
};

export const updateManager = async (
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

    const updatedManager = await prisma.manager.update({
      where: { cognitoId },
      data: {
        name,
        email,
        phoneNumber,
      },
    });

    res.json(updatedManager);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error updating manager", error: error.message });
  }
};
