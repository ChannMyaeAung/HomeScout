import express, { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  listApplications,
  createApplication,
  updateApplicationStatus,
} from "../controllers/applicationControllers.js";

const router: Router = express.Router();

router.get("/", authMiddleware(["tenant", "manager"]), listApplications);
router.post("/", authMiddleware(["tenant"]), createApplication);
router.put("/:id/status", authMiddleware(["manager"]), updateApplicationStatus);

export default router;
