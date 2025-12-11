import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Unauthorized" });
  const parts = header.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: "Missing JWT_SECRET" });
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET as string);
    const payload = typeof verified === "object" && verified ? (verified as any) : {};
    (req as any).userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
