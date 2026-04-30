import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

export const getProperties = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
    } = req.query;

    // Each filter from the query string is optional — users may search with
    // any combination (price only, beds + baths, all filters, none at all).
    // We build up SQL fragments one by one, then join them with AND at the end.
    // This gives us one flexible query instead of dozens of if-else branches.
    let whereConditions: Prisma.Sql[] = [];

    // favoriteIds arrives as a comma-separated string e.g. "3,7,12".
    // We split it into an array of numbers and use SQL IN (...) so only
    // properties the tenant has favorited are returned.
    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`,
      );
    }

    // Only add the price floor condition if the user actually set a minimum.
    // Skipping it means "no lower bound" — all prices are included.
    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`,
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`,
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching properties", error: error.message });
  }
};
