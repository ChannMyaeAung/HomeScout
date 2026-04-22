import express, { Router } from "express";
import {
  createManager,
  getManager,
} from "../controllers/managerControllers.js";

const router: Router = express.Router();

router.get("/:cognitoId", getManager);
router.post("/", createManager);

export default router;
