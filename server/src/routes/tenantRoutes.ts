import express, { Router } from "express";
import { createTenant, getTenant } from "../controllers/tenantControllers.js";

const router: Router = express.Router();

router.get("/:cognitoId", getTenant);
router.post("/", createTenant);

export default router;
