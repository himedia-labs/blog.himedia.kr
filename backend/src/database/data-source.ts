import 'reflect-metadata';
import { config } from 'dotenv';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

const envFile = `.env.${process.env.NODE_ENV ?? 'development'}`;
config({ path: resolve(__dirname, '..', '..', envFile) });
const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.HM_DB_HOST,
  port: Number(process.env.HM_DB_PORT ?? 5432),
  username: process.env.HM_DB_USER,
  password: process.env.HM_DB_PASSWORD,
  database: process.env.HM_DB_NAME,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [resolve(__dirname, '..', '..', '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: !isProduction,
});

export default AppDataSource;
