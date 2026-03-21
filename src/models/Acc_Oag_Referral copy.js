// /src/models/Acc_Oag_Referral.js
import mongoose from "mongoose";

const AccOagReferralSchema = new mongoose.Schema(
  {
    case_no: { type: String, required: true },
    case_description: { type: String, required: true },
    investigator_detail: { type: String, required: true },
    status: { type: String, default: "Pending" },
    referral_date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// **IMPORTANT:** Explicitly set the collection name to match your existing one
export default mongoose.models.AccOagReferral || 
  mongoose.model("AccOagReferral", AccOagReferralSchema, "acc_oag_referrals");