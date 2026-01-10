"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Rnd } from "react-rnd";
import { 
  Type, 
  PenTool, 
  Calendar, 
  ChevronLeft, 
  Send, 
  Loader2, 
  X,
  MousePointer2
} from "lucide-react";

interface Field {
  id: string;
  type: "signature" | "name" | "date";
  x: number;
  y: number;
}

export default function PreparePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<Field[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        
        if (res.ok) {
          // Handles both { meeting: {...} } or direct object response
          setMeeting(data.meeting || data);
        }
      } catch (err) {
        console.error("Error fetching document:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMeeting();
  }, [id]);

  const addField = (type: "signature" | "name" | "date") => {
    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
    };
    setFields([...fields, newField]);
  };

  const handleSend = async () => {
    setIsSaving(true);
    // Logic to save field positions to your DB would go here
    setTimeout(() => {
      alert("Document prepared and saved!");
      setIsSaving(false);
      router.push("/dashboard");
    }, 1000);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f8f9fc]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Loading Document...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b px-8 py-3 flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{meeting?.title || "Untitled Document"}</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Prepare Mode</p>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSend}
          disabled={isSaving}
          className="bg-[#0015ff] text-white px-8 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} 
          Finish & Send
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-72 bg-white border-r p-6 flex flex-col gap-6 z-40 shadow-xl">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Draggable Fields</h3>
            <div className="space-y-3">
              <button 
                onClick={() => addField("signature")}
                className="w-full flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition group bg-white shadow-sm"
              >
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
                  <PenTool size={18} />
                </div>
                <span className="text-sm font-bold text-gray-700">Signature</span>
              </button>

              <button 
                onClick={() => addField("name")}
                className="w-full flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition group bg-white shadow-sm"
              >
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Type size={18} />
                </div>
                <span className="text-sm font-bold text-gray-700">Full Name</span>
              </button>

              <button 
                onClick={() => addField("date")}
                className="w-full flex items-center gap-3 p-4 border border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition group bg-white shadow-sm"
              >
                <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
                  <Calendar size={18} />
                </div>
                <span className="text-sm font-bold text-gray-700">Date Signed</span>
              </button>
            </div>
          </div>

          <div className="mt-auto border-t pt-6">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">Recipients</p>
            <div className="space-y-3">
              {meeting?.participants?.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                    {p.name[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{p.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Document Viewer */}
        <main className="flex-1 overflow-auto p-12 flex justify-center bg-[#e2e8f0] relative">
          <div className="relative bg-white shadow-2xl w-212.5 min-h-275 border border-gray-300 mb-20">
            
            {/* Layer 1: The Document (Bottom) */}
            <div className="absolute inset-0 z-0">
              {meeting?.filePath ? (
                <object
                  data={`${meeting.filePath}#toolbar=0&navpanes=0&scrollbar=0`}
                  type="application/pdf"
                  className="w-full h-full border-none"
                >
                  <div className="h-full flex items-center justify-center text-center p-10">
                    <p className="text-gray-500">
                      PDF preview not supported. <a href={meeting.filePath} className="text-blue-600 underline" target="_blank">Download instead</a>
                    </p>
                  </div>
                </object>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Loader2 className="animate-spin" />
                  <p className="text-sm">Rendering preview...</p>
                </div>
              )}
            </div>

            {/* Layer 2: Draggable Overlay (Top) */}
            {/* pointer-events-none on the container allows scrolling the doc, pointer-events-auto on fields allows dragging */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              {fields.map((field) => (
                <Rnd
                  key={field.id}
                  size={{ width: 160, height: 48 }}
                  position={{ x: field.x, y: field.y }}
                  onDragStop={(e, d) => {
                    setFields(fields.map(f => f.id === field.id ? { ...f, x: d.x, y: d.y } : f));
                  }}
                  bounds="parent"
                  className="pointer-events-auto"
                >
                  <div className={`
                    w-full h-full border-2 border-dashed flex items-center justify-center rounded-lg shadow-xl bg-white/90 backdrop-blur-sm group
                    ${field.type === 'signature' ? 'border-orange-400 text-orange-700' : 
                      field.type === 'name' ? 'border-blue-400 text-blue-700' : 
                      'border-green-400 text-green-700'}
                  `}>
                    <div className="flex items-center gap-2">
                      <MousePointer2 size={12} className="opacity-40" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{field.type}</span>
                    </div>
                    <button 
                      onClick={() => setFields(fields.filter(f => f.id !== field.id))}
                      className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-md border p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </Rnd>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}