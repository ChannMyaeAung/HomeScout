import express, { Router } from "express";
import {
  createTenant,
  getTenant,
  updateTenant,
} from "../controllers/tenantControllers.js";

const router: Router = express.Router();

router.get("/:cognitoId", getTenant);
router.put("/:cognitoId", updateTenant);
router.post("/", createTenant);

export default router;
