import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { Location } from "../../generated/prisma/client.js";
import { wktToGeoJSON } from "@terraformer/wkt";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client } from "@aws-sdk/client-s3";
import axios from "axios";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-southeast-1",
});

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

    const whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = (favoriteIds as string).split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`,
      );
    }

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

    // >= so selecting "2 beds" also returns 3+ bed properties
    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`,
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`,
      );
    }

    if (propertyType && propertyType !== "any") {
      // Cast to Postgres enum — plain string comparison would fail against an enum column
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`,
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = (amenities as string).split(",");
      // @> is Postgres array containment: property must have ALL requested amenities
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== "any") {
      const availableFromDate =
        typeof availableFrom === "string" ? availableFrom : null;
      if (availableFromDate) {
        const date = new Date(availableFromDate);
        if (!isNaN(date.getTime())) {
          whereConditions.push(
            Prisma.sql`EXISTS (
              SELECT 1 FROM "Lease" l
              WHERE l."propertyId" = p.id
              AND l."startDate" <= ${date.toISOString()}
            )`,
          );
        }
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lng = parseFloat(longitude as string);

      const radiusInKilometers = 1000;
      // ST_DWithin in geometry mode expects degrees, not meters
      // 1 degree ≈ 111 km
      const degrees = radiusInKilometers / 111;

      // Uses PostGIS.
      // ST_DWithin checks if two map points are within a distance.
      // ST_SetSRID(..., 4326) sets WGS84 — the standard GPS coordinate system.
      // ST_MakePoint creates a GPS point.
      // ::geometry casts from geography (curved earth) to geometry (flat plane) for the calc.
      whereConditions.push(
        Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`,
      );
    }

    // Raw SQL required: Prisma ORM cannot call PostGIS functions or build
    // the nested location JSON object at the query level.
    // camelCase column names are double-quoted to prevent Postgres from lowercasing them.
    const completeQuery = Prisma.sql`
      SELECT
        p.*,
        json_build_object(
          'id',          l.id,
          'address',     l.address,
          'city',        l.city,
          'state',       l.state,
          'country',     l.country,
          'postalCode',  l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude',  ST_Y(l.coordinates::geometry)
          )
        ) AS location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
          : Prisma.empty
      }
    `;

    const properties = await prisma.$queryRaw(completeQuery);
    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching properties", error: error.message });
  }
};

export const getProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prisma can fetch all scalar columns and join the location row,
    // but it cannot decode the PostGIS geography column — it returns binary.
    // We handle coordinates in a separate raw query below.
    const property = await prisma.property.findUnique({
      where: { id: Number(id) },
      include: { location: true },
    });

    if (property) {
      // ST_AsText converts the PostGIS geography value to WKT (Well-Known Text),
      // a human-readable format: e.g. POINT(-74.006 40.7128)
      // Prisma cannot read geography columns directly, so raw SQL is required here.
      const coordinates: { coordinates: string }[] =
        await prisma.$queryRaw`SELECT ST_AsText(coordinates) AS coordinates FROM "Location" WHERE id = ${property.locationId}`;

      // wktToGeoJSON parses the WKT string into a GeoJSON object:
      // { type: "Point", coordinates: [longitude, latitude] }
      // GeoJSON always stores coordinates as [longitude, latitude] (x, y order)
      const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
      const longitude = geoJSON.coordinates[0];
      const latitude = geoJSON.coordinates[1];

      res.json({
        ...property,
        location: {
          ...property.location,
          coordinates: { longitude, latitude },
        },
      });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error fetching property", error: error.message });
  }
};

export const createProperty = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const {
      address,
      city,
      state,
      country,
      postalCode,
      managerCognitoId,
      ...propertyData
    } = req.body;

    // Upload each photo to S3 and collect the resulting public URLs.
    // Files arrive in memory via multer (buffer), not saved to disk.
    const photoUrls = (
      await Promise.all(
        files.map(async (file) => {
          const uploadParams = {
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: `properties/${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          };
          const uploadResult = await new Upload({
            client: s3Client,
            params: uploadParams,
          }).done();
          return uploadResult.Location;
        }),
      )
    )
      // filter out any undefined results and narrows the type to string[], though ideally all uploads should succeed or throw an error
      .filter((url): url is string => url !== undefined);

    // Nominatim (OpenStreetMap) converts a street address into lat/lng coordinates.
    // A real User-Agent is required — Nominatim blocks generic or empty agents.
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: address,
        city,
        country,
        postalcode: postalCode,
        format: "json",
        limit: "1",
      },
    ).toString()}`;

    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        "User-Agent": "HomeScoutApp/1.0 (justsomedummyemail@gmail.com)",
      },
    });

    // Fall back to [0, 0] if the address couldn't be geocoded
    const [longitude, latitude] =
      geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0].lon),
            parseFloat(geocodingResponse.data[0].lat),
          ]
        : [0, 0];

    // Raw INSERT required: Prisma cannot write PostGIS geography values via its ORM.
    // ST_MakePoint(lng, lat) note: longitude is x-axis, latitude is y-axis.
    const [location] = await prisma.$queryRaw<Location[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        ${address}, ${city}, ${state}, ${country}, ${postalCode},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) AS coordinates
    `;

    if (!location) throw new Error("Failed to create location");

    // multipart/form-data sends everything as strings
    // coerce numeric and boolean fields
    // before writing to the DB so Prisma's types are satisfied.
    const newProperty = await prisma.property.create({
      data: {
        ...propertyData,
        photoUrls,
        locationId: location.id,
        managerCognitoId,
        amenities:
          typeof propertyData.amenities === "string"
            ? propertyData.amenities.split(",")
            : [],
        highlights:
          typeof propertyData.highlights === "string"
            ? propertyData.highlights.split(",")
            : [],
        isPetsAllowed: propertyData.isPetsAllowed === "true",
        isParkingIncluded: propertyData.isParkingIncluded === "true",
        pricePerMonth: parseFloat(propertyData.pricePerMonth),
        securityDeposit: parseFloat(propertyData.securityDeposit),
        applicationFee: parseFloat(propertyData.applicationFee),
        beds: parseInt(propertyData.beds),
        baths: parseFloat(propertyData.baths),
        squareFeet: parseInt(propertyData.squareFeet),
      },
      include: {
        location: true,
        manager: true,
      },
    });

    res.status(201).json(newProperty);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Error creating property", error: error.message });
  }
};
