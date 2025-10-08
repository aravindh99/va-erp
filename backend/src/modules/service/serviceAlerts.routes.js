import { Router } from "express";
import ServiceAlertsController from "./serviceAlerts.controller.js";
import { authorize } from "../../shared/middlewares/auth.js";

const router = Router();

// Get all service alerts (vehicles, compressors, items)
router.get("/", authorize("read"), ServiceAlertsController.getAllServiceAlerts);

// Get only urgent service alerts for notifications (RPM difference < 50)
router.get("/urgent", authorize("read"), ServiceAlertsController.getUrgentAlerts);

export default router;
