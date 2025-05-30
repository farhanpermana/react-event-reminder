import 'dotenv/config';
import { SequelizeOptions } from 'sequelize-typescript';

interface SequelizeConfig {
  [key: string]: SequelizeOptions;
}

const config: SequelizeConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log,
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
};

export default config;
