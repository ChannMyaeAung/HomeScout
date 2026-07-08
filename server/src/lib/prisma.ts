import { PrismaClient } from "../../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createPgPool } from "./pgPool.js";

const pool = createPgPool();
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
