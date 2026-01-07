"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

interface Participant {
  name: string;
  email: string;
  signed?: boolean;
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  description: string;
  participants: Participant[];
  fileName?: string;
  filePath?: string;
  status: "Draft" | "Prepared" | "Sent" | "Signed";
}

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  // Fetch meeting data
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMeeting(data.meeting);
          setTitle(data.meeting.title);
          setDate(data.meeting.date.split("T")[0]);
          setDescription(data.meeting.description);
          setParticipants(data.meeting.participants);
        } else {
          setMessage(data.error || "Failed to load meeting");
        }
      } catch (err) {
        console.error(err);
        setMessage("Server error");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMeeting();
  }, [id]);

  // Participant functions
  const addParticipant = () => {
    if (!name || !email) return setMessage("Name and email are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setMessage("Invalid email format");
    if (participants.some((p) => p.email === email))
      return setMessage("Participant already added");

    setParticipants([...participants, { name, email }]);
    setName("");
    setEmail("");
    setMessage("");
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipants(participants.filter((p) => p.email !== emailToRemove));
  };

  // Handle form submission
  const handleSubmit = async (action: "draft" | "prepare") => {
    if (!title || !date || !description) {
      setMessage("All fields are required");
      return;
    }

    const formData = new FormData();
    formData.append(
      "data",
      JSON.stringify({ title, date, description, participants, action })
    );
    if (file) formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        if (action === "draft") router.push("/dashboard");
        if (action === "prepare") router.push(`/dashboard/meetings/${id}`);
      } else {
        setMessage(data.error || "Failed to save meeting");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  if (loading) return <p className="p-6">Loading...</p>;
  if (!meeting) return <p className="p-6 text-red-500">{message || "Meeting not found"}</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Meeting</h2>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Meeting Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* File upload */}
          <div>
            <label className="block mb-1 font-semibold">Upload File (PDF/DOC)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {meeting.filePath && !file && (
              <p className="mt-2 text-sm text-gray-600">
                Current file: <a href={meeting.filePath} target="_blank">{meeting.fileName}</a>
              </p>
            )}
          </div>

          {/* Participants */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold mb-2">Participants</h3>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={addParticipant}
                className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 transition"
              >
                Add
              </button>
            </div>
            <ul className="mb-2">
              {participants.map((p) => (
                <li
                  key={p.email}
                  className="flex justify-between bg-gray-100 px-3 py-1 rounded-xl mb-1"
                >
                  <span>
                    {p.name} ({p.email})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeParticipant(p.email)}
                    className="text-red-500 font-bold hover:text-red-700"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => handleSubmit("draft")}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit("prepare")}
              className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition"
            >
              Prepare
            </button>
          </div>
        </div>
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
