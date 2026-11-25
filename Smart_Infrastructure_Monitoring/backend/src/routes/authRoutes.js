import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readStore, writeStore, newId, now } from "../store.js";
import { protect } from "../middleware/auth.js";

const router = Router();
const makeToken = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn:"7d" });
const publicUser = user => ({ id:user.id, name:user.name, email:user.email, role:user.role });

router.post("/register", async (req,res,next) => {
  try {
    const {name,email,password}=req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({message:"Name, email and password are required."});
    if (password.length<8) return res.status(400).json({message:"Password must be at least 8 characters."});
    const store=await readStore(), normalized=email.toLowerCase().trim();
    if (store.users.some(u=>u.email===normalized)) return res.status(409).json({message:"An account with this email already exists."});
    const user={id:newId(),name:name.trim(),email:normalized,password:await bcrypt.hash(password,12),role:"citizen",createdAt:now()};
    store.users.push(user); await writeStore(store);
    res.status(201).json({token:makeToken(user.id),user:publicUser(user)});
  } catch(err){next(err);}
});
router.post("/login",async(req,res,next)=>{
  try {
    const {email,password}=req.body, store=await readStore();
    const user=store.users.find(u=>u.email===email?.toLowerCase().trim());
    if(!user || !(await bcrypt.compare(password||"",user.password))) return res.status(401).json({message:"Incorrect email or password."});
    res.json({token:makeToken(user.id),user:publicUser(user)});
  }catch(err){next(err);}
});
router.get("/me",protect,(req,res)=>res.json({user:req.user}));
export default router;
