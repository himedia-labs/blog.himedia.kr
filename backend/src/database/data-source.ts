import 'reflect-metadata';
import { config } from 'dotenv';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

const envFile = `.env.${process.env.NODE_ENV ?? 'development'}`;
config({ path: resolve(__dirname, '..', '..', envFile) });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [resolve(__dirname, '..', '..', '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: false,
});

export default AppDataSource;
