import type { Knex } from "knex";
import 'dotenv/config';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    // Support connection strings that include SSL parameters (e.g. Neon)
    // If the DATABASE_URL contains sslmode or other ssl params, pass through
    // an explicit ssl object so pg/pg-connection-string won't warn.
    connection: ((): any => {
      const url = process.env.DATABASE_URL;
      if (!url) return undefined;
      if (url.includes("sslmode") || url.includes("channel_binding")) {
        return { connectionString: url, ssl: { rejectUnauthorized: false } };
      }
      return { connectionString: url };
    })(),
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./db/seeds",
      extension: "ts",
    },
  },

  production: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./db/migrations",
      extension: "ts",
    },
  },
};

export default config;
