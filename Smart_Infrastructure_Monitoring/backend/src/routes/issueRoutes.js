import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { readStore, writeStore, newId, now } from "../store.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router=Router(), uploadDir=path.resolve("uploads");
fs.mkdirSync(uploadDir,{recursive:true});
const storage=multer.diskStorage({
  destination:(_req,_file,cb)=>cb(null,uploadDir),
  filename:(_req,file,cb)=>cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${path.extname(file.originalname).toLowerCase()}`)
});
const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_req,file,cb)=>{
  if(/^image\/(jpeg|png|webp)$/.test(file.mimetype)) cb(null,true);
  else cb(new Error("Only JPG, PNG and WEBP images are allowed."));
}});
const categories=["Damaged Road","Pothole","Broken Streetlight","Blocked Drain","Damaged Public Facility","Other"];
const priorities=["Low","Medium","High","Critical"], statuses=["Pending","In Progress","Resolved"];

router.get("/",protect,async(req,res,next)=>{
  try{
    const store=await readStore(),{search,status,category,priority}=req.query;
    let issues=store.issues.filter(i=>req.user.role==="admin"||i.reportedBy===req.user.id);
    if(status&&status!=="All")issues=issues.filter(i=>i.status===status);
    if(category&&category!=="All")issues=issues.filter(i=>i.category===category);
    if(priority&&priority!=="All")issues=issues.filter(i=>i.priority===priority);
    if(search){const q=search.toLowerCase();issues=issues.filter(i=>[i.title,i.location,i.description].some(v=>v.toLowerCase().includes(q)));}
    const users=new Map(store.users.map(u=>[u.id,{name:u.name,email:u.email}]));
    issues.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    res.json({issues:issues.map(i=>({...i,reportedBy:users.get(i.reportedBy)||{name:"Community member"}}))});
  }catch(err){next(err);}
});
router.post("/",protect,upload.single("photo"),async(req,res,next)=>{
  try{
    const {title,category,description,location,latitude,longitude,priority}=req.body;
    if(!title?.trim()||!categories.includes(category)||!description?.trim()||!location?.trim())
      return res.status(400).json({message:"Please complete all required fields and choose a valid category."});
    const lat=latitude===""||latitude==null?null:Number(latitude), lng=longitude===""||longitude==null?null:Number(longitude);
    if((lat!==null&&(!Number.isFinite(lat)||lat < -90||lat>90))||(lng!==null&&(!Number.isFinite(lng)||lng < -180||lng>180))||((lat===null)!==(lng===null)))
      return res.status(400).json({message:"Enter both valid latitude and longitude, or leave both blank."});
    const store=await readStore();
    const issue={id:newId(),title:title.trim(),category,description:description.trim(),location:location.trim(),latitude:lat,longitude:lng,
      priority:priorities.includes(priority)?priority:"Medium",status:"Pending",photo:req.file?`/uploads/${req.file.filename}`:"",
      assignedTeam:"Unassigned",reportedBy:req.user.id,createdAt:now(),updatedAt:now()};
    store.issues.push(issue);await writeStore(store);res.status(201).json({issue});
  }catch(err){next(err);}
});
router.patch("/:id",protect,adminOnly,async(req,res,next)=>{
  try{
    const store=await readStore(),issue=store.issues.find(i=>i.id===req.params.id);
    if(!issue)return res.status(404).json({message:"Issue not found."});
    if(req.body.status!==undefined){if(!statuses.includes(req.body.status))return res.status(400).json({message:"Invalid issue status."});issue.status=req.body.status;}
    if(typeof req.body.assignedTeam==="string")issue.assignedTeam=req.body.assignedTeam.trim().slice(0,100)||"Unassigned";
    issue.updatedAt=now();await writeStore(store);
    const reporter=store.users.find(u=>u.id===issue.reportedBy);
    res.json({issue:{...issue,reportedBy:reporter?{name:reporter.name,email:reporter.email}:{name:"Community member"}}});
  }catch(err){next(err);}
});
router.get("/stats/summary",protect,async(req,res,next)=>{
  try{
    const store=await readStore(),items=store.issues.filter(i=>req.user.role==="admin"||i.reportedBy===req.user.id);
    res.json({total:items.length,pending:items.filter(i=>i.status==="Pending").length,inProgress:items.filter(i=>i.status==="In Progress").length,
      resolved:items.filter(i=>i.status==="Resolved").length,critical:items.filter(i=>i.priority==="Critical"&&i.status!=="Resolved").length});
  }catch(err){next(err);}
});
export default router;
