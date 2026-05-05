import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { wktToGeoJSON } from "@terraformer/wkt";

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

export const getManagerProperties = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const cognitoId = req.params.cognitoId as string | undefined;
    if (!cognitoId) {
      res.status(400).json({ message: "cognitoId is required" });
      return;
    }

    const properties = await prisma.property.findMany({
      where: { managerCognitoId: cognitoId },
      include: { location: true },
    });

    // Prisma returns the PostGIS geography column as binary — unreadable as-is.
    // For each property, a raw query decodes it to WKT then we parse lat/lng out.
    // NOTE: this is an N+1 pattern (1 extra query per property). Acceptable for
    // a manager's own listings which are typically few, but worth consolidating
    // into a single raw JOIN query if the list grows large.
    const propertiesWithFormattedLocation = await Promise.all(
      properties.map(async (property) => {
        // ST_AsText converts the PostGIS geography column to WKT format, which is a text representation of the geometry.
        // wktToGeoJSON parses that string into {type: "Point", coordinates: [longitude, latitude]}
        const coordinates: { coordinates: string }[] =
          await prisma.$queryRaw`SELECT ST_AsText(coordinates) AS coordinates FROM "Location" WHERE id = ${property.locationId}`;

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

    res.json(propertiesWithFormattedLocation);
  } catch (error: any) {
    res
      .status(500)
      .json({
        message: "Error fetching manager properties",
        error: error.message,
      });
  }
};
