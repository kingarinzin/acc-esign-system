"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function MyLeavePage() {
  const [leaves, setLeaves] = useState([]);

  const getUser = () => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("user"));
  };

  const fetchMyBalance = async () => {
    const user = getUser();
    if (!user?._id) return;

    const res = await fetch(
      `/api/leave-balances?userId=${user._id}`
    );

    const data = await res.json();

    if (data?.leaves) {
      setLeaves(data.leaves);
    } else {
      setLeaves([]);
    }
  };

  useEffect(() => {
    fetchMyBalance();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">
          My Leave Balance
        </h1>

        <div className="grid md:grid-cols-3 gap-4">
          {leaves.length > 0 ? (
            leaves.map((leave) => (
              <div
                key={leave.leaveTypeId}
                className="bg-white shadow rounded-xl p-5 border-l-4 border-blue-500"
              >
                <h3 className="text-sm text-gray-500">
                  {leave.leaveTypeName}
                </h3>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {leave.balance}
                </p>
                <p className="text-xs text-gray-400">
                  Allocated: {leave.allocated} | Used: {leave.used}
                </p>
              </div>
            ))
          ) : (
            <div className="bg-white p-5 rounded shadow">
              No leave balance found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}