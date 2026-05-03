import express, { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import multer from "multer";
import { getProperties } from "../controllers/propertyControllers.js";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router: Router = express.Router();

router.get("/", getProperties);
// router.get("/:id", getProperty);
// router.post("/", authMiddleware(["manager"]),upload.array("photos"), createProperty);

export default router;
