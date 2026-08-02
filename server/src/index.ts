import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { authMiddleware } from "./middleware/authMiddleware.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import leaseRoutes from "./routes/leaseRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

// ROUTE IMPORT

// CONFIGURATION
dotenv.config();
const app = express();

// Configure Helmet with CORS-friendly Cross-Origin Resource Policy
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allows cross-origin resources

app.use(express.json());
app.use(morgan("common"));
app.use(express.urlencoded({ extended: false }));

// Configure CORS explicitly for the Amplify Frontend
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Amz-Date",
      "X-Api-Key",
      "X-Amz-Security-Token",
    ],
  }),
);

// ROUTES
app.get("/", (_req, res) => {
  res.send("This is home route");
});
app.use("/properties", propertyRoutes);
app.use("/leases", leaseRoutes);
app.use("/applications", applicationRoutes);

// PROTECTED ROUTES
app.use("/tenants", authMiddleware(["tenant"]), tenantRoutes);
app.use("/managers", authMiddleware(["manager"]), managerRoutes);

// SERVER
const PORT = Number(process.env.PORT) || 3002;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`server running on port ${PORT}`);
});
