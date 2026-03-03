import mongoose from "mongoose";

const LeaveApplicationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  leaveTypeId: { type: String, required: true },
  fromDate: Date,
  toDate: Date,
  days: Number,
  reason: String,
  status: { type: String, default: "Pending" },
}, { timestamps: true });

export default mongoose.models.LeaveApplication ||
  mongoose.model("LeaveApplication", LeaveApplicationSchema);