import type { Knex } from "knex";
import 'dotenv/config';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "postgresql",
    connection: {
      connectionString: process.env.DATABASE_URL,
      password: process.env.DB_PASSWORD,
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
