import jwt from "jsonwebtoken";
import { readStore } from "../store.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Please sign in first." });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const store = await readStore();
    const user = store.users.find(item => item.id === decoded.id);
    if (!user) return res.status(401).json({ message: "Account not found." });
    req.user = { id:user.id, name:user.name, email:user.email, role:user.role };
    next();
  } catch {
    return res.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
  }
}
export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Administrator access required." });
  next();
}
