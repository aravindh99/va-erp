import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Database configuration with connection pooling
const dbConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
    },
    dialectOptions: {
      connectTimeout: 60000,
    },
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 5,
    },
    dialectOptions: {
      connectTimeout: 60000,
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

const environment = process.env.NODE_ENV || "development";
const config = dbConfig[environment];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

// Test database connection with retry logic
export const connectDB = async () => {
  let retries = config.retry?.max || 3;
  
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      
      // Sync database in development (be careful in production!)
      if (environment === "development") {
        await sequelize.sync({ alter: false });
      }
      
      return true;
    } catch (error) {
      retries--;
      console.error(`❌ Database connection failed (${config.retry.max - retries}/${config.retry.max}):`, error.message);
      
      if (retries === 0) {
        console.error("❌ Could not connect to database after multiple attempts");
        process.exit(1);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await sequelize.close();
  process.exit(0);
});

export default sequelize;
