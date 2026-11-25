import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./src/routes/authRoutes.js";
import issueRoutes from "./src/routes/issueRoutes.js";
import { readStore } from "./src/store.js";

dotenv.config();
const app=express(),__filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
app.use(cors({origin:process.env.CLIENT_URL||"http://localhost:5173"}));
app.use(express.json({limit:"2mb"}));
app.use("/uploads",express.static(path.join(__dirname,"uploads")));
app.get("/api/health",async(_req,res,next)=>{try{await readStore();res.json({status:"ok",message:"API and JSON storage are ready."});}catch(err){next(err);}});
app.use("/api/auth",authRoutes);
app.use("/api/issues",issueRoutes);
app.use((err,_req,res,_next)=>{console.error(err);res.status(err.status||500).json({message:err.message||"Server error"});});
const PORT=process.env.PORT||5000;
if(!process.env.JWT_SECRET){console.error("Set JWT_SECRET in backend/.env");process.exit(1);}
await readStore();
app.listen(PORT,()=>console.log(`API running at http://localhost:${PORT}`));
