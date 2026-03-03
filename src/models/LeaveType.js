import mongoose from "mongoose";

const LeaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Leave type name is required"],
      trim: true,
      unique: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "leave-types", // ✅ matches your manually created collection
  }
);

// Prevent model overwrite in development (Next.js hot reload fix)
export default mongoose.models.LeaveType ||
  mongoose.model("LeaveType", LeaveTypeSchema);