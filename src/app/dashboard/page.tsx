"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


interface Meeting {
  _id: string;
  title: string;
  date: string;
  status: "Draft" | "Sent" | "Signed";
  participants: { name: string; email: string; signed: boolean }[];
}

export default function Dashboard() {
  const router = useRouter(); // <-- initialize router

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/meetings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setMeetings(data.meetings || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => router.push("/dashboard/new-meeting")}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
        >
          + New Meeting
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <p className="text-gray-500">Total Meetings</p>
          <h2 className="text-2xl font-bold text-gray-800">{meetings.length}</h2>
        </div>
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <p className="text-gray-500">Pending Signatures</p>
          <h2 className="text-2xl font-bold text-yellow-500">
            {meetings.filter(m => m.status === "Sent").length}
          </h2>
        </div>
        <div className="bg-white shadow-xl rounded-2xl p-6">
          <p className="text-gray-500">Completed Signatures</p>
          <h2 className="text-2xl font-bold text-green-500">
            {meetings.filter(m => m.status === "Signed").length}
          </h2>
        </div>
      </div>

      {/* Meetings Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="col-span-full text-center text-gray-500">Loading meetings...</p>
        ) : meetings.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No meetings found. Create a new meeting to get started.
          </p>
        ) : (
          meetings.map(meeting => (
            <div key={meeting._id} className="bg-white shadow-xl rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{meeting.title}</h3>
                <p className="text-gray-500 mb-1">Date: {new Date(meeting.date).toLocaleDateString()}</p>
                <p className="text-gray-500 mb-2">Participants: {meeting.participants.length}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    meeting.status === "Draft"
                      ? "bg-gray-200 text-gray-700"
                      : meeting.status === "Sent"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  {meeting.status}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
              <button
                onClick={() => router.push(`/dashboard/meetings/${meeting._id}`)}
                className="flex-1 bg-blue-500 text-white py-2 rounded-xl"
              >
                View
              </button>
                {meeting.status === "Draft" && (
                <button
                  onClick={() => router.push(`/dashboard/meetings/${meeting._id}/edit`)}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-xl"
                >
                  Edit
                </button>

                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
