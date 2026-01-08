"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  Plus, X, FileText, Upload, Trash2, 
  Save, Play, Send, CheckCircle2, Loader2, ArrowLeft
} from "lucide-react";

interface Participant {
  name: string;
  email: string;
  role: string;
}

export default function EditMeetingPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

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

  // 1. Fetch Existing Data
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          // Handle both { meeting: {...} } and direct {...} responses
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

  // Inside EditMeetingPage component
const handleSubmit = async (isPrepareAction: boolean) => {
  setIsSubmitting(true);
  const token = localStorage.getItem("token");
  const formData = new FormData();
  
  if (file) formData.append("file", file);
  
  // We send the "action" inside the JSON string
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
      body: formData, // No Content-Type header needed for FormData
    });

    if (res.ok) {
      // If it was the prepare button, go to prepare page
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
      {/* Header Bar - Identical to New Meeting */}
      <header className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-indigo-600 transition">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-indigo-900">Edit Draft</h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit(false)} 
            className="px-5 py-2 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-full hover:bg-indigo-50 transition"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
          <button 
            disabled={isSubmitting}
            onClick={() => handleSubmit(true)} 
            className="px-6 py-2 text-sm font-medium text-white bg-blue-700 rounded-full hover:bg-blue-800 transition shadow-md flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} 
            Prepare
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        
        {/* Section 1: File Upload Area */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="w-48 h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center bg-gray-50 relative group">
              {file || existingFileName ? (
                <div className="text-center p-4">
                  <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                  <p className="text-[10px] font-medium text-gray-400 mb-1 uppercase tracking-tighter">Current File</p>
                  <p className="text-xs font-bold text-indigo-900 truncate w-32">{file ? file.name : existingFileName}</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No file attached</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-gray-100 rounded-lg bg-gray-50/30">
                <button className="bg-white border px-6 py-2 rounded-full text-blue-600 text-sm font-bold shadow-sm hover:bg-gray-50 transition">
                    Replace Document
                </button>
                <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold tracking-widest">Keep existing or upload new</p>
            </div>
          </div>
        </section>

        {/* Section 2: Signers & CCs */}
        <section className="bg-[#edf2f7] rounded-t-xl overflow-hidden border">
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
                        <select className="text-xs p-2 border rounded bg-white outline-none font-medium">
                            <option>Signer</option>
                            <option>CC</option>
                        </select>
                        <button onClick={() => removeParticipant(p.email)} className="p-2 text-gray-400 hover:text-red-500 transition">
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
                    className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 hover:bg-indigo-50 transition shadow-sm"
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