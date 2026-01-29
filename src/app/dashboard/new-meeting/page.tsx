"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { X, FileText, Upload, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

const NewMeetingPdfClient = dynamic(() => import("./NewMeetingPdfClient"), { ssr: false });

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Missing token. Please log in again.");
      setIsSubmitting(false);
      return;
    }

    const error = validateBeforeSubmit();
    if (error) {
      setMessage(error);
      setIsSubmitting(false);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3748] pb-20">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="cursor-pointer text-gray-400 hover:text-indigo-600 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-indigo-900">New Document</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)}
            className="cursor-pointer px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Draft"}
          </button>
          <button
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)}
            className="cursor-pointer px-6 py-2 text-sm font-medium text-white bg-[#1a2b4a] rounded-full hover:bg-[#0f1b2e] transition shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
            Prepare
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* File Upload with Preview */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            Document Upload
          </h2>
          <div className="flex gap-6">
            {/* Preview Area */}
            <div className="w-52 h-72 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 relative group overflow-hidden shadow-lg">
              {file ? (
                <>
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <NewMeetingPdfClient file={file} />
                  </div>
                  
                  {/* File Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-3 text-white">
                    <p className="text-[10px] font-bold truncate">{file.name}</p>
                    <p className="text-[9px] text-white/70">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="absolute top-2 right-2 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-30"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <Upload className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-xs text-gray-400 font-medium">No file selected</p>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {/* Upload Instructions */}
            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                {file ? "Document Ready" : "Upload Your Document"}
              </h3>
              
              <p className="text-xs text-gray-500 mb-4 max-w-xs">
                {file 
                  ? "Your document is ready. You can change it or proceed to prepare."
                  : "Click below or drag and drop a PDF file to get started."
                }
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer bg-[#1a2b4a] hover:bg-[#0f1b2e] text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Upload size={16} />
                {file ? "Change Document" : "Choose File"}
              </button>
              
              <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                Supported: PDF files only
              </p>
              
              {file && (
                <div className="mt-4 px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Ready to Upload
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Signers */}
        <section className="bg-[#edf2f7] rounded-xl overflow-hidden border shadow-sm">
          <div className="px-6 py-3 border-b flex justify-between items-center">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-gray-500" /> Signers & CCs
            </h3>
          </div>

          <div className="p-4 space-y-3 bg-white">
            {participants.map((p) => (
              <div key={p.email} className="flex items-center gap-3 p-2 border rounded-lg bg-white shadow-sm group">
                <div className="flex-1 flex gap-2">
                  <input readOnly value={p.name} className="flex-1 text-sm p-2 border rounded bg-gray-50 text-gray-600" />
                  <input readOnly value={p.email} className="flex-[1.2] text-sm p-2 border rounded bg-gray-50 text-gray-600" />
                </div>

                <select
                  value={p.role}
                  onChange={(e) => updateRole(p.email, e.target.value as "Signer" | "CC")}
                  className="cursor-pointer text-xs p-2 border rounded bg-white outline-none font-medium"
                >
                  <option value="Signer">Signer</option>
                  <option value="CC">CC</option>
                </select>

                <button
                  onClick={() => removeParticipant(p.email)}
                  className="cursor-pointer p-2 text-gray-400 hover:text-red-500 transition"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 border-t flex gap-3">
            <input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-sm p-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 text-sm p-2 border rounded-lg focus:ring-2 focus:ring-indigo-100 outline-none transition"
            />
            <button
              onClick={addParticipant}
              type="button"
              className="cursor-pointer px-6 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition shadow-sm"
            >
              Add
            </button>
          </div>
        </section>

        {/* Title & Message */}
        <section className="bg-[#edf2f7] rounded-xl overflow-hidden border shadow-sm">
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
                placeholder="e.g. Service Agreement"
                className="w-full p-3 border rounded-xl bg-[#f8fafc] text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition"
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
                placeholder="Please sign this document..."
                className="w-full p-3 border rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>
        </section>

        {message && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center font-medium">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}