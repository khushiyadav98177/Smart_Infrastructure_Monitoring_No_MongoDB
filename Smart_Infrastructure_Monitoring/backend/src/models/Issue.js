
import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: ["Damaged Road", "Pothole", "Broken Streetlight", "Blocked Drain", "Damaged Public Facility", "Other"], required: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  location: { type: String, required: true, trim: true, maxlength: 250 },
  latitude: { type: Number, min: -90, max: 90, default: null },
  longitude: { type: Number, min: -180, max: 180, default: null },
  priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
  photo: { type: String, default: "" },
  assignedTeam: { type: String, default: "Unassigned", maxlength: 100 },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Issue", issueSchema);
