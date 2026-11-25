import dotenv from "dotenv";
import { readStore, writeStore } from "../src/store.js";
dotenv.config();
const email=process.argv[2]?.toLowerCase().trim();
if(!email){console.error("Usage: npm run make-admin -- user@example.com");process.exit(1);}
try{
 const store=await readStore(),user=store.users.find(u=>u.email===email);
 if(!user)console.error("No account found. Register on the website first.");
 else{user.role="admin";await writeStore(store);console.log(`${user.email} is now an administrator. Sign out and sign in again.`);}
}catch(err){console.error(err.message);process.exitCode=1;}
