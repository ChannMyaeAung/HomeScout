import express, { Router } from "express";
import {
  createManager,
  getManager,
  updateManager,
} from "../controllers/managerControllers.js";

const router: Router = express.Router();

router.get("/:cognitoId", getManager);
router.put("/:cognitoId", updateManager);
router.post("/", createManager);

export default router;
