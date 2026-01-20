"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Edit2, 
  ChevronDown, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Edit3,
  Loader2
} from "lucide-react";

interface Meeting {
  _id: string;
  title: string;
  date: string;
  status: "Draft" | "Sent" | "Completed" | "Prepared";
  participants: { name: string; email: string; signed: boolean; isCurrent?: boolean }[];
  sentAt?: string;
  currentSignerIndex?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [signatureImg, setSignatureImg] = useState<string | null>(null);
  const [initialsImg, setInitialsImg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const sigInputRef = useRef<HTMLInputElement>(null);
  const initialsInputRef = useRef<HTMLInputElement>(null);


  // Fetch Signatures
useEffect(() => {
  async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSignatureImg(data.signature || null);
        setInitialsImg(data.initials || null);
        
        if (data.signature) localStorage.setItem("userSignature", data.signature);
      }
    } catch (err) {
      console.error("Profile load error:", err);
    }
  }
  loadProfile();
}, []);

  // 1. Fetch Meetings
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
        console.error("Failed to fetch meetings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMeetings();
  }, []);

  // 2. Fetch User Signature Profile
  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSignatureImg(data.signature || null);
        setInitialsImg(data.initials || null);
      }
    }
    loadProfile();
  }, []);

  // Calculate Status Counts
  const drafts = meetings.filter(m => m.status === "Draft");
  const pendingCount = meetings.filter(m => m.status === "Sent" || m.status === "Prepared").length;
  const completedCount = meetings.filter(m => m.status === "Completed").length;

  // Get signing progress for a meeting
  const getSigningProgress = (meeting: Meeting) => {
    const signers = meeting.participants.filter(p => p.signed !== undefined);
    const signed = signers.filter(p => p.signed).length;
    return { signed, total: signers.length };
  };

  // Handle Signature Uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'signature' | 'initials') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      if (type === 'signature') setSignatureImg(base64String);
      else setInitialsImg(base64String);

      try {
        setIsUploading(true);
        const token = localStorage.getItem("token");
        await fetch("/api/user/update-signature", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ [type]: base64String }),
        });
      } catch (err) {
        console.error("Upload failed", err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3748]">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b px-8 py-3 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-indigo-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">SN</div>
          <button 
            onClick={() => router.push("/dashboard/new-meeting")}
            className="bg-[#0015ff] cursor-pointer text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-800 transition shadow-lg shadow-blue-100"
          >
            New Meeting +
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Top Grid: Documents Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Documents Status */}
          <section className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="px-6 py-3 border-b bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Documents Overview
            </div>
            <div>
              <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500 p-1.5 rounded text-white"><AlertCircle size={18} /></div>
                  <span className="text-sm font-medium text-gray-700">Drafts</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{drafts.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 border-b hover:bg-gray-50 transition cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500 p-1.5 rounded text-white"><Clock size={18} /></div>
                  <span className="text-sm font-medium text-gray-700">Pending Actions</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-default">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 p-1.5 rounded text-white"><CheckCircle2 size={18} /></div>
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{completedCount}</span>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="px-6 py-3 border-b bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Activity</span>
            </div>
            <div className="p-4 space-y-4 min-h-40">
              {meetings.length > 0 ? (
                meetings.slice(0, 4).map((m, i) => {
                  const progress = getSigningProgress(m);
                  const statusColor = m.status === 'Completed' ? 'text-green-600' : 
                                     m.status === 'Sent' ? 'text-blue-600' : 
                                     m.status === 'Prepared' ? 'text-orange-600' : 'text-gray-600';
                  
                  return (
                    <div key={i} className="text-xs text-gray-600 border-b border-gray-50 pb-2">
                      <div className="flex justify-between items-start mb-1">
                        <span>
                          <span className="font-semibold text-indigo-900">{m.title}</span>
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          {m.sentAt ? new Date(m.sentAt).toLocaleDateString() : new Date(m.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${statusColor}`}>
                          {m.status}
                        </span>
                        {m.status === 'Sent' && (
                          <span className="text-[10px] text-gray-500">
                            {progress.signed}/{progress.total} signed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs italic">
                  No activity yet
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Middle Section: Signatures & Drafts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Signature Assets */}
          <div className="space-y-4">
            <div 
              onClick={() => sigInputRef.current?.click()}
              className="bg-white border rounded-xl p-4 flex justify-between items-start shadow-sm relative overflow-hidden h-28 cursor-pointer hover:border-indigo-400 transition group"
            >
              <input type="file" ref={sigInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} />
              <div className="z-10">
                <h4 className="text-xs font-bold text-gray-400 uppercase">My Signature</h4>
                <button className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 group-hover:underline">
                  <Edit2 size={10} /> {signatureImg ? 'Change' : 'Upload'}
                </button>
              </div>
              <div className="absolute right-8 top-0 bottom-0 flex items-center justify-center w-1/2">
                {signatureImg ? (
                  <img src={signatureImg} alt="Signature" className="max-h-20 object-contain" />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <Upload size={20} />
                    <span className="text-[10px] uppercase font-bold mt-1">Upload</span>
                  </div>
                )}
              </div>
            </div>

            <div 
              onClick={() => initialsInputRef.current?.click()}
              className="bg-white border rounded-xl p-4 flex justify-between items-start shadow-sm relative overflow-hidden h-28 cursor-pointer hover:border-indigo-400 transition group"
            >
              <input type="file" ref={initialsInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'initials')} />
              <div className="z-10">
                <h4 className="text-xs font-bold text-gray-400 uppercase">My Initials</h4>
                <button className="text-[10px] text-blue-600 mt-1 flex items-center gap-1 group-hover:underline">
                  <Edit2 size={10} /> {initialsImg ? 'Change' : 'Upload'}
                </button>
              </div>
              <div className="absolute right-12 top-0 bottom-0 flex items-center justify-center w-1/3">
                {initialsImg ? (
                  <img src={initialsImg} alt="Initials" className="max-h-16 object-contain" />
                ) : (
                  <div className="flex flex-col items-center text-gray-300">
                    <Upload size={20} />
                    <span className="text-[10px] uppercase font-bold mt-1">Upload</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Drafts List */}
          <section className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm self-stretch flex flex-col">
            <div className="px-6 py-3 border-b bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Drafts</span>
              {drafts.length > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{drafts.length} Total</span>}
            </div>
            <div className="flex-1 bg-white min-h-56">
              {drafts.length > 0 ? (
                drafts.slice(0, 5).map(draft => (
                  <div 
                    key={draft._id} 
                    onClick={() => router.push(`/dashboard/meetings/${draft._id}/edit`)} 
                    className="flex justify-between p-4 border-b text-sm items-center hover:bg-indigo-50 group cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Edit3 size={14} className="text-gray-400 group-hover:text-indigo-600" />
                      <span className="font-medium text-gray-700 group-hover:text-indigo-900 transition-colors">{draft.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400 text-xs">
                        {new Date(draft.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-bold uppercase transition-opacity">
                        Edit
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-gray-400 text-xs italic">
                   No drafts to show
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}