"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function LeaveBalancePage() {
  const [leaveData, setLeaveData] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
      console.log("User not logged in");
      return;
    }

    fetch(`/api/leave-balances?userId=${user._id}`)
      .then((res) => res.json())
      .then((data) => setLeaveData(data))
      .catch((err) => console.error(err));
  }, []);

  if (!leaveData) {
    return <div className="p-6">Loading leave balance...</div>;
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 bg-gray-100 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">
          My Leave Balance
        </h1>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">
            {leaveData.userName}
          </h2>

          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Leave Type</th>
                <th className="p-2 text-center">Allocated</th>
                <th className="p-2 text-center">Used</th>
                <th className="p-2 text-center">Balance</th>
              </tr>
            </thead>

            <tbody>
              {leaveData.leaves?.map((leave) => (
                <tr key={leave.leaveTypeId}>
                  <td className="p-2">{leave.leaveTypeName}</td>
                  <td className="p-2 text-center">{leave.allocated}</td>
                  <td className="p-2 text-center">{leave.used}</td>
                  <td className="p-2 text-center font-bold">
                    {leave.balance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}