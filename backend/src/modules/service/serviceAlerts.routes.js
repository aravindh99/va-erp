import { Router } from "express";
import ServiceAlertsController from "./serviceAlerts.controller.js";
import { authorize } from "../../shared/middlewares/auth.js";

const router = Router();

// Get all service alerts (vehicles, compressors, items)
router.get("/", authorize("read"), ServiceAlertsController.getAllServiceAlerts);

export default router;
