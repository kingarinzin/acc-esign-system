"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, FileText, Upload, CheckCircle2 } from "lucide-react";

interface Participant {
  name: string;
  email: string;
  role: "Signer" | "CC";
}

export default function NewMeetingPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addParticipant = () => {
    const n = name.trim();
    const e = email.trim();

    if (!n || !e) {
      setMessage("Name and email are required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(e)) {
      setMessage("Invalid email format");
      return;
    }

    const exists = participants.some((p) => p.email.toLowerCase() === e.toLowerCase());
    if (exists) {
      setMessage("This email is already added");
      return;
    }

    setParticipants((prev) => [...prev, { name: n, email: e, role: "Signer" }]);
    setName("");
    setEmail("");
    setMessage("");
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipants((prev) => prev.filter((p) => p.email !== emailToRemove));
  };

  const updateRole = (emailToUpdate: string, role: "Signer" | "CC") => {
    setParticipants((prev) =>
      prev.map((p) => (p.email === emailToUpdate ? { ...p, role } : p))
    );
  };

  const validateBeforeSubmit = () => {
    if (!file) return "Please upload a file (.pdf or .docx).";
    if (!title.trim()) return "Document Title is required.";
    if (!description.trim()) return "Message is required.";
    if (participants.length === 0) return "Add at least one signer/participant.";
    return null;
  };

  const handleSubmit = async (prepare: boolean) => {
    setMessage("");

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Missing token. Please log in again.");
      return;
    }

    const error = validateBeforeSubmit();
    if (error) {
      setMessage(error);
      return;
    }

    const formData = new FormData();
    if (file) formData.append("file", file);

    formData.append(
      "data",
      JSON.stringify({
        title,
        description,
        participants,
        action: prepare ? "prepare" : "draft",
      })
    );

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        if (prepare) router.push(`/dashboard/prepare/${data.meetingId}`);
        else router.push("/dashboard");
      } else {
        setMessage(data.error || "Failed to save meeting");
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3748] pb-20">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-bold text-indigo-900">New Document</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSubmit(false)}
            className="px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit(true)}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-700 rounded-full hover:bg-blue-800 transition shadow-md"
          >
            Prepare
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* File Upload */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="w-48 h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50 relative">
              {file ? (
                <div className="text-center p-4">
                  <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                  <p className="text-xs font-medium truncate w-40">{file.name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Drop files here</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white border px-6 py-2 rounded-full text-blue-600 font-semibold shadow-sm hover:bg-gray-50"
              >
                Choose Files
              </button>
              <p className="text-xs text-gray-400 mt-2">Supported formats: .pdf, .doc, .docx</p>
            </div>
          </div>
        </section>

        {/* Signers */}
        <section className="bg-[#edf2f7] rounded-t-xl">
          <div className="px-6 py-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-500" /> Signers & CCs
            </h3>
            <label className="text-xs flex items-center gap-2 text-gray-600">
              <input type="checkbox" className="rounded" /> Signing Order
            </label>
          </div>

          <div className="p-4 space-y-3 bg-white border-x">
            {participants.map((p) => (
              <div key={p.email} className="flex items-center gap-3 p-2 border rounded-lg bg-white">
                <div className="flex-1 flex gap-2">
                  <input readOnly value={p.name} className="flex-1 text-sm p-2 border rounded bg-gray-50" />
                  <input readOnly value={p.email} className="flex-[1.2] text-sm p-2 border rounded bg-gray-50" />
                </div>

                <select
                  value={p.role}
                  onChange={(e) => updateRole(p.email, e.target.value as "Signer" | "CC")}
                  className="text-sm p-2 border rounded bg-white outline-none"
                >
                  <option value="Signer">Signer</option>
                  <option value="CC">CC</option>
                </select>

                <button
                  onClick={() => removeParticipant(p.email)}
                  className="p-2 text-gray-400 hover:text-red-500"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-x border-b rounded-b-xl flex gap-3">
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-sm p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 text-sm p-2 border rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={addParticipant}
              type="button"
              className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg border border-indigo-200 hover:bg-indigo-100 transition"
            >
              Add
            </button>
          </div>
        </section>

        {/* Title & Message */}
        <section className="bg-[#edf2f7] rounded-xl overflow-hidden border">
          <div className="px-6 py-3 border-b">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
              <FileText className="w-4 h-4" /> Title & Message
            </h3>
          </div>

          <div className="p-6 bg-white space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                Document Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border rounded bg-[#f1f5f9] text-sm outline-none focus:border-indigo-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">
                Message
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded bg-white text-sm outline-none focus:border-indigo-300"
              />
            </div>
          </div>
        </section>

        {message && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm text-center font-medium">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
