import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LeaveBalance from "@/models/LeaveBalance";
import LeaveApplication from "@/models/LeaveApplication";

export async function POST(req) {
  try {
    await connectDB();

    const { userId, leaveTypeId, fromDate, toDate, reason } = await req.json();

    if (!userId || !leaveTypeId || !fromDate || !toDate) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // Calculate number of leave days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Find leave balance
    const leaveBalance = await LeaveBalance.findOne({ userId });

    if (!leaveBalance) {
      return NextResponse.json({ message: "Leave balance not found" }, { status: 404 });
    }

    // Find specific leave type
    const leaveType = leaveBalance.leaves.find(
      (l) => l.leaveTypeId.toString() === leaveTypeId
    );

    if (!leaveType) {
      return NextResponse.json({ message: "Leave type not found" }, { status: 404 });
    }

    if (leaveType.balance < days) {
      return NextResponse.json({ message: "Not enough leave balance" }, { status: 400 });
    }

    // Update leave usage
    leaveType.used += days;
    leaveType.balance -= days;

    await leaveBalance.save();

    // Save leave application record
    await LeaveApplication.create({
      userId,
      leaveTypeId,
      fromDate,
      toDate,
      days,
      reason,
      status: "Approved", // since admin applying
    });

    return NextResponse.json({ message: "Leave applied successfully" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}