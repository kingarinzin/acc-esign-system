"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Plus, X, FileText, Upload, Trash2, 
  Save, Play, Send, CheckCircle2, Loader2, ArrowLeft
} from "lucide-react";

const EditPdfClient = dynamic(() => import("./EditPdfClient"), { ssr: false });

interface Participant {
  name: string;
  email: string;
  role: string;
}

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Existing Data
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          const m = data.meeting || data;
          setTitle(m.title || "");
          setDescription(m.description || "");
          setParticipants(m.participants || []);
          setExistingFileName(m.fileName || "Existing Document");
        } else {
          setMessage("Failed to load document data.");
        }
      } catch (err) {
        setMessage("Server error loading data.");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMeeting();
  }, [id]);

  const addParticipant = () => {
    if (!name || !email) return setMessage("Name and email are required");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return setMessage("Invalid email format");
    
    setParticipants([...participants, { name, email, role: "Signer" }]);
    setName(""); setEmail(""); setMessage("");
  };

  const removeParticipant = (emailToRemove: string) => {
    setParticipants(participants.filter(p => p.email !== emailToRemove));
  };

  const handleSubmit = async (isPrepareAction: boolean) => {
    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    
    if (file) formData.append("file", file);
    
    formData.append("data", JSON.stringify({ 
      title, 
      description, 
      participants, 
      action: isPrepareAction ? "prepare" : "draft" 
    }));

    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        if (isPrepareAction) {
          router.push(`/dashboard/prepare/${id}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      setMessage("Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
      <Loader2 className="animate-spin text-indigo-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3748] pb-20">
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="cursor-pointer text-gray-400 hover:text-indigo-600 transition">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-indigo-900">Edit Draft</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)} 
            className="cursor-pointer px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)} 
            className="cursor-pointer px-6 py-2 text-sm font-medium text-white bg-blue-700 rounded-full hover:bg-blue-800 transition shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} 
            Prepare
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Section 1: File Upload Area with Real Preview */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-600" />
            Document Upload
          </h2>
          <div className="flex gap-6">
            {/* Preview Area */}
            <div className="w-52 h-72 border-2 border-gray-200 rounded-xl flex flex-col items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 relative group overflow-hidden shadow-lg">
              <div className="w-full h-full relative flex items-center justify-center p-2">
                {/* The dynamic thumbnail that fetches remote PDF data */}
                <EditPdfClient file={file} meetingId={id} />
              </div>

              {/* File Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-3 text-white">
                <p className="text-[10px] font-bold truncate">
                  {file ? file.name : existingFileName}
                </p>
                {file && <p className="text-[9px] text-white/70">{(file.size / 1024).toFixed(0)} KB</p>}
              </div>

              {/* Remove Button - show always when file is selected */}
              {file && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="absolute top-2 right-2 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-full p-1.5 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-30"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="application/pdf"
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />

            {/* Upload Instructions */}
            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h3 className="text-sm font-bold text-gray-700 mb-2">
                {file ? "New Document Selected" : "Current Document"}
              </h3>
              
              <p className="text-xs text-gray-500 mb-4 max-w-xs">
                {file 
                  ? "A new file has been selected. Save changes to update the document."
                  : "Replace the current document by selecting a new PDF file."
                }
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <Upload size={16} />
                Replace Document
              </button>
              
              <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-widest">
                Supported: PDF files only
              </p>
              
              {file && (
                <div className="mt-4 px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  New File Ready
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 2: Signers & CCs */}
        <section className="bg-[#edf2f7] rounded-xl overflow-hidden border">
            <div className="px-6 py-3 border-b bg-[#edf2f7] flex justify-between items-center">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-500" /> Signers & CCs
                </h3>
            </div>
            <div className="p-4 space-y-3 bg-white">
                {participants.map((p, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 border rounded-lg bg-white group shadow-sm">
                        <div className="flex-1 flex gap-2">
                            <input readOnly value={p.name} className="flex-1 text-sm p-2 border rounded bg-gray-50 text-gray-600" />
                            <input readOnly value={p.email} className="flex-1 text-sm p-2 border rounded bg-gray-50 text-gray-600" />
                        </div>
                        <select 
                          className="cursor-pointer text-xs p-2 border rounded bg-white outline-none font-medium"
                          value={p.role}
                          onChange={() => {}} 
                        >
                            <option value="Signer">Signer</option>
                            <option value="CC">CC</option>
                        </select>
                        <button onClick={() => removeParticipant(p.email)} className="p-2 cursor-pointer text-gray-400 hover:text-red-500 transition">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-3">
                <input 
                    placeholder="Name" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="flex-1 text-sm p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition" 
                />
                <input 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    className="flex-1 text-sm p-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition" 
                />
                <button 
                    onClick={addParticipant}
                    className="cursor-pointer px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition shadow-sm"
                >
                    Add Signer
                </button>
            </div>
        </section>

        {/* Section 3: Title & Message */}
        <section className="bg-[#edf2f7] rounded-xl overflow-hidden border shadow-sm">
            <div className="px-6 py-3 border-b">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                    <FileText className="w-4 h-4" /> Title & Message
                </h3>
            </div>
            <div className="p-6 bg-white space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Document Title</label>
                    <input 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-3 border rounded-xl bg-[#f8fafc] text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" 
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Message</label>
                    <textarea 
                        rows={4}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full p-3 border rounded-xl bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition" 
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