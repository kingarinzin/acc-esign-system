import mongoose from "mongoose";

const LeaveEntrySchema = new mongoose.Schema({
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LeaveType",
    required: true,
  },
  leaveTypeName: {
    type: String,
    required: true,
  },
  allocated: {
    type: Number,
    default: 0,
  },
  used: {
    type: Number,
    default: 0,
  },
  balance: {
    type: Number,
    default: 0,
  },
});

const LeaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    leaves: [LeaveEntrySchema],
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

export default mongoose.models.LeaveBalance ||
  mongoose.model("LeaveBalance", LeaveBalanceSchema, "leave_balances");