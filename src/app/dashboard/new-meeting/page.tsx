"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Participant {
  name: string;
  email: string;
  signed?: boolean;
}

export default function NewMeetingPage() {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const addParticipant = () => {
    if (!name || !email) {
      setMessage("Name and email are required for each participant");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Invalid email format");
      return;
    }
    if (participants.some(p => p.email === email)) {
      setMessage("Participant with this email already added");
      return;
    }
    setParticipants([...participants, { name, email }]);
    setName("");
    setEmail("");
    setMessage("");
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipants(participants.filter(p => p.email !== emailToRemove));
  };

  const handleSubmit = async (prepare: boolean) => {
    if (!title || !date || !description) {
      setMessage("All fields are required");
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file as Blob);
    formData.append(
      "data",
      JSON.stringify({ title, date, description, participants })
    );

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Meeting saved!");
        setTitle("");
        setDate("");
        setDescription("");
        setParticipants([]);
        setFile(null);
        if (prepare) {
          router.push(`/dashboard/prepare/${data.id}`); // move to signing page
        } else {
          router.push("/dashboard"); // back to dashboard
        }
      } else {
        setMessage(data.error || "Failed to save meeting");
      }
    } catch (err) {
      console.error(err);
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Meeting</h2>

        <input
          type="text"
          placeholder="Meeting Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="p-3 border border-gray-300 rounded-xl w-full mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="p-3 border border-gray-300 rounded-xl w-full mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="p-3 border border-gray-300 rounded-xl w-full mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={e => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />

        {/* Participants */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="font-semibold mb-2">Participants</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
            {participants.map(p => (
              <li key={p.email} className="flex justify-between bg-gray-100 px-3 py-1 rounded-xl mb-1">
                <span>{p.name} ({p.email})</span>
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

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Prepare
          </button>
        </div>

        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}
