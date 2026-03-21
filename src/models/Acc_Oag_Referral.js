import mongoose from "mongoose";

const AccOagReferralSchema = new mongoose.Schema(
  {
    // ================= ACC SIDE =================
    case_no: { type: String, required: true },
    case_description: { type: String, required: true },
    investigator_detail: { type: String, required: true },

    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Sent", "In Progress", "Closed"],
    },

    referral_date: { type: Date, default: Date.now },

    // ================= ACCUSED DETAILS =================
    accused_details: [
      {
        name: String,
        cid: String,
        act_charges: String,
        prayer: String,
        counts: String,
      },
    ],

    // ================= OAG SIDE =================
    oag_status: {
      type: String,
      default: null,
      enum: ["Received", "Under Review", "Returned", "Accepted", null],
    },

    oag_remarks: { type: String, default: "" },

    oag_response_date: { type: Date },

    oag_updated_by: { type: String },

    // Optional: assign to specific OAG officer
    assigned_oag_officer: { type: String },

    // Optional: attachments (file paths)
    oag_attachments: [{ type: String }],

    // ================= AUDIT / TRACKING =================
    created_by: { type: String },
    updated_by: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.AccOagReferral ||
  mongoose.model(
    "AccOagReferral",
    AccOagReferralSchema,
    "acc_oag_referrals"
  );