import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

interface DecodedToken extends JwtPayload {
  sub: string; // Cognito User ID
  "custom:role": string;
}

// Adding onto the interface Request that already exists for Typescript
// so that we can handle the authentication better
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

// Middleware to check if the user is authenticated and has the correct role
// Functionality: decodes and verifies the JWT against Cognito's public key
// If valid, it attaches the user's identity to req.user
// so controllers know who is asking
// allowedRoles is an array of strings because there might be routes that
// both tenants and managers can access.
// we can try decoding the token in jwt.io
export const authMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = req.headers.authorization?.split(" ")[1]; // Get the token from the Authorization header (`Bearer <token>`)

    if (!token) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    // If the token is there, decode it to get the user's role and check if they have access
    try {
      const decoded = jwt.decode(token) as DecodedToken;
      const userRole = decoded["custom:role"] || "";
      req.user = {
        id: decoded.sub,
        role: userRole,
      };

      const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      if (!hasAccess) {
        res.status(403).json({ message: "Access Denied" });
        return;
      }
    } catch (error) {
      console.error("Failed to decode token:", error);
      res.status(400).json({ message: "Invalid token" });
      return;
    }

    next();
  };
};
