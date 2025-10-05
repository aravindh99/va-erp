import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import os from "os";
import authRoutes from "./src/modules/auth/auth.routes.js";
import { authenticate } from "./src/shared/middlewares/auth.js";
import { connectDB } from "./src/config/db.js";
import sequelize from "./src/config/db.js";
import { apiLimiter } from "./src/shared/middlewares/rateLimit.js";
import { seedAdminUser } from "./src/shared/seedAdmin.js";
import { notFound } from "./src/shared/middlewares/notFound.js";
import { errorHandler } from "./src/shared/middlewares/errorHandler.js";
import {
  employeeListRoutes,
  employeeAttendanceRoutes,
} from "./src/modules/employee/index.js";
import { brandRoutes } from "./src/modules/brand/index.js";
import { dailyEntryRoutes } from "./src/modules/dailyEntry/index.js";
import { itemRoutes } from "./src/modules/item/index.js";
import { poRoutes } from "./src/modules/po/index.js";
import { poItemRoutes } from "./src/modules/poItem/index.js";
import { serviceRoutes } from "./src/modules/service/index.js";
import serviceAlertsRoutes from "./src/modules/service/serviceAlerts.routes.js";
import { siteRoutes } from "./src/modules/site/index.js";
import { supplierRoutes } from "./src/modules/supplier/index.js";
import { vehicleRoutes } from "./src/modules/vehicle/index.js";
import { compressorRoutes } from "./src/modules/compressor/index.js";
import { userRoutes } from "./src/modules/user/index.js";
import { addressRoutes } from "./src/modules/address/index.js";
import stockTransactionRoutes from "./src/modules/stockTransaction/stockTransaction.routes.js";
import itemInstanceRoutes from "./src/modules/itemInstance/itemInstance.routes.js";
import { defineAssociations } from "./src/shared/models/associations.js";

const app = express();

dotenv.config();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api", apiLimiter);

// Connect DB
const initializeDatabase = async () => {
  try {
    await connectDB(); // connect only
    defineAssociations(); // define relationships

    console.log(Object.keys(sequelize.models));

    await sequelize.sync({ force: false, alter: true }); // now sync with associations
    await seedAdminUser();
    console.log("✅ Database initialized successfully with associations");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

// Initialize database before setting up routes
await initializeDatabase();

app.get("/health", (req, res) => {
  res.send(`server is running and healthy ;)`);
});

// routes without auth  (/api/auth/login)
app.use("/api/auth", authRoutes);

const protectedRoutes = express.Router();

// Mount all module routes on protected routes

// Employee routes
protectedRoutes.use("/employeeLists", employeeListRoutes);
protectedRoutes.use("/employeeAttendance", employeeAttendanceRoutes);

// Brand routes
protectedRoutes.use("/brands", brandRoutes);

// Daily Entry routes
protectedRoutes.use("/dailyEntries", dailyEntryRoutes);

// Item routes
protectedRoutes.use("/items", itemRoutes);

// Purchase Order routes
protectedRoutes.use("/pos", poRoutes);
protectedRoutes.use("/poItems", poItemRoutes);

// Service routes
protectedRoutes.use("/services", serviceRoutes);
protectedRoutes.use("/service-alerts", serviceAlertsRoutes);

// Site routes
protectedRoutes.use("/sites", siteRoutes);

// Supplier routes
protectedRoutes.use("/suppliers", supplierRoutes);

//address routes
protectedRoutes.use("/address", addressRoutes);

// Vehicle routes
protectedRoutes.use("/vehicles", vehicleRoutes);

// Compressor routes
protectedRoutes.use("/compressors", compressorRoutes);

// User Management routes (Admin only)
protectedRoutes.use("/users", userRoutes);

// Stock Transaction routes
protectedRoutes.use("/stockTransactions", stockTransactionRoutes);


// Item Instance routes
protectedRoutes.use("/itemInstances", itemInstanceRoutes);

// Now apply auth + mount once
app.use("/api", authenticate, protectedRoutes);

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "0.0.0.0";
}

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

app.listen(PORT, `0.0.0.0`, () => {
  try {
    const ip = getLocalIp();
    console.log(`
        
        server is running:  http://localhost:${PORT}
                            http://${ip}:${PORT} 
    `);
  } catch (err) {
    console.log(`error in running server ${err}`);
  }
});
