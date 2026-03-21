// /models/Raa_Acc_Referral.js
import mongoose from "mongoose";

const RaaAccReferralSchema = new mongoose.Schema({
  year: { type: String, required: true },
  ainParoNo: { type: String, required: true },
  accountabilityEntity: { type: String, required: true },
  referralNo: { type: String, required: true },
  referralDate: { type: Date, required: true },
  status: { type: String, default: "Pending" },
}, { timestamps: true });

// Avoid recompilation in development
export default mongoose.models.RaaAccReferral || mongoose.model("RaaAccReferral", RaaAccReferralSchema, "raa_acc_referrals");