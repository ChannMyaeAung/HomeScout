import fs from "fs";
import pg from "pg";

export function createPgPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const config: pg.PoolConfig = { connectionString };
  const caPath = process.env.PGSSLROOTCERT;

  if (caPath) {
    if (!fs.existsSync(caPath)) {
      throw new Error(`PGSSLROOTCERT file not found: ${caPath}`);
    }
    config.ssl = {
      ca: fs.readFileSync(caPath).toString(),
      rejectUnauthorized: true,
    };
  } else if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false") {
    config.ssl = { rejectUnauthorized: false };
  }

  return new pg.Pool(config);
}
