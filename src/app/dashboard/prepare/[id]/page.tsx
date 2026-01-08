"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Rnd } from "react-rnd"; // For drag and drop
import { 
  Type, 
  PenTool, 
  Calendar, 
  ChevronLeft, 
  Send, 
  Loader2,
  Check
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

  useEffect(() => {
    async function fetchMeeting() {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMeeting(data.meeting || data);
      setLoading(false);
    }
    fetchMeeting();
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
    // Logic to save field positions and send emails
    alert("Document sent for signing!");
    router.push("/dashboard");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5]">
      {/* Top Navbar */}
      <header className="bg-white border-b px-6 py-3 flex justify-between items-center shadow-sm z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">{meeting?.title}</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Prepare Mode</p>
          </div>
        </div>
        <button 
          onClick={handleSend}
          className="bg-[#0015ff] text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition"
        >
          <Send size={16} /> Finish & Send
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-64 bg-white border-r p-6 flex flex-col gap-4 z-10 shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Fields</h3>
          
          <button 
            onClick={() => addField("signature")}
            className="flex items-center gap-3 p-3 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group text-left"
          >
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition">
              <PenTool size={18} />
            </div>
            <span className="text-sm font-semibold">Signature</span>
          </button>

          <button 
            onClick={() => addField("name")}
            className="flex items-center gap-3 p-3 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group text-left"
          >
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Type size={18} />
            </div>
            <span className="text-sm font-semibold">Full Name</span>
          </button>

          <button 
            onClick={() => addField("date")}
            className="flex items-center gap-3 p-3 border rounded-xl hover:border-blue-500 hover:bg-blue-50 transition group text-left"
          >
            <div className="bg-green-100 p-2 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition">
              <Calendar size={18} />
            </div>
            <span className="text-sm font-semibold">Date Signed</span>
          </button>

          <div className="mt-auto border-t pt-4">
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-2">Recipients</p>
            {meeting?.participants.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {p.name[0]}
                </div>
                <span className="text-xs font-medium truncate">{p.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Document Viewer */}
        <main className="flex-1 overflow-auto p-12 flex justify-center bg-gray-200/50">
          <div className="relative bg-white shadow-2xl min-w-150 min-h-210.5 w-200 border">
            {/* The actual document */}
            {meeting?.filePath ? (
              <iframe 
                src={`${meeting.filePath}#toolbar=0`} 
                className="w-full h-full border-none pointer-events-none" 
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No document found
              </div>
            )}

            {/* Draggable Overlay Fields */}
            {fields.map((field) => (
              <Rnd
                key={field.id}
                default={{
                  x: field.x,
                  y: field.y,
                  width: 150,
                  height: 40,
                }}
                bounds="parent"
                className="z-30"
              >
                <div className={`
                  w-full h-full border-2 border-dashed flex items-center justify-center rounded px-2
                  ${field.type === 'signature' ? 'border-orange-400 bg-orange-50/80 text-orange-700' : 
                    field.type === 'name' ? 'border-blue-400 bg-blue-50/80 text-blue-700' : 
                    'border-green-400 bg-green-50/80 text-green-700'}
                `}>
                  <span className="text-[10px] font-bold uppercase tracking-tighter flex items-center gap-1">
                    {field.type === 'signature' && <PenTool size={10} />}
                    {field.type === 'name' && <Type size={10} />}
                    {field.type === 'date' && <Calendar size={10} />}
                    {field.type}
                  </span>
                  <button 
                    onClick={() => setFields(fields.filter(f => f.id !== field.id))}
                    className="absolute -top-2 -right-2 bg-white rounded-full shadow border text-gray-400 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </div>
              </Rnd>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// Internal X icon helper
const X = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);