"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function OagReferralPage() {
  const [referrals, setReferrals] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    oag_status: "",
    oag_remarks: "",
    oag_attachments: [],
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchData = async () => {
    const res = await fetch("/api/oag/referrals", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setReferrals(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const res = await fetch("/api/oag/update-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        _id: selected._id,
        ...form,
      }),
    });

    if (res.ok) {
      alert("Updated successfully");
      fetchData();
      setSelected(null);
    } else {
      alert("Failed to update");
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6 ml-64">
        <h1 className="text-2xl font-bold mb-4">OAG Referrals</h1>

        {/* TABLE */}
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th>Case No</th>
              <th>Description</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {referrals.map((r) => (
              <tr key={r._id}>
                <td>{r.case_no}</td>
                <td>{r.case_description}</td>
                <td>{r.oag_status || "Pending"}</td>
                <td>
                  <button
                    onClick={() => {
                      setSelected(r);
                      setForm({
                        oag_status: r.oag_status || "",
                        oag_remarks: r.oag_remarks || "",
                        oag_attachments: r.oag_attachments || [],
                      });
                    }}
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Review
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL / FORM */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded w-1/2">
              <h2 className="text-lg font-bold mb-4">OAG Response</h2>

              <select
                value={form.oag_status}
                onChange={(e) =>
                  setForm({ ...form, oag_status: e.target.value })
                }
                className="border w-full mb-2 p-2"
              >
                <option value="">Select Status</option>
                <option value="Under Review">Under Review</option>
                <option value="Returned">Returned</option>
                <option value="Accepted">Accepted</option>
              </select>

              <textarea
                placeholder="Remarks"
                value={form.oag_remarks}
                onChange={(e) =>
                  setForm({ ...form, oag_remarks: e.target.value })
                }
                className="border w-full mb-2 p-2"
              />

              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded mr-2"
              >
                Submit
              </button>

              <button
                onClick={() => setSelected(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}