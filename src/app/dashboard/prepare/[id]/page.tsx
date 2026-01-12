"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const PdfRenderer = dynamic(() => import("./PdfRenderer"), { ssr: false });

import {
  Type,
  PenTool,
  Calendar,
  ChevronLeft,
  Send,
  Loader2,
  X,
  MousePointer2,
} from "lucide-react";

type FieldType = "signature" | "name" | "date";

interface Field {
  id: string; // client-only id (db ids are handled by API replace strategy)
  type: FieldType;
  page: number; // 1-based
  xPct: number; // 0..1
  yPct: number; // 0..1
  wPct: number; // 0..1
  hPct: number; // 0..1
}

type PageRect = { w: number; h: number };

function PageWrapper({
  pageNumber,
  children,
  onRect,
}: {
  pageNumber: number;
  children: React.ReactNode;
  onRect: (page: number, w: number, h: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const r = node.getBoundingClientRect();
      onRect(pageNumber, r.width, r.height);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(node);

    return () => ro.disconnect();
  }, [pageNumber, onRect]);

  return (
    <div
      ref={ref}
      className="relative bg-white shadow-2xl border border-gray-300"
    >
      {children}
    </div>
  );
}

export default function PreparePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [fields, setFields] = useState<Field[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [numPages, setNumPages] = useState<number>(0);

  // Track each page container size for px conversion
  const [pageRects, setPageRects] = useState<Record<number, PageRect>>({});
  const [placingType, setPlacingType] = useState<FieldType | null>(null);

  // --- Fetch meeting ---
  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setMeeting(data.meeting || data);
      } catch (err) {
        console.error("Error fetching meeting:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchMeeting();
  }, [id]);

  // --- Fetch fields ---
  useEffect(() => {
    async function fetchFields() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}/fields`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) setFields(Array.isArray(data.fields) ? data.fields : []);
      } catch (err) {
        console.error("Error fetching fields:", err);
      }
    }
    if (id) fetchFields();
  }, [id]);

  const tokenHeader = useMemo(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const addField = (type: FieldType) => {
    // Default: place on page 1 (or first page)
    const page = 1;

    setFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        page,
        xPct: 0.1,
        yPct: 0.1,
        wPct: 0.25,
        hPct: 0.08,
      },
    ]);
  };

  // Inside PreparePage.tsx
const [userSignature, setUserSignature] = useState<string | null>(null);

useEffect(() => {
  async function loadUserSignature() {
    // Try to get from localStorage first (fast)
    const localSig = localStorage.getItem("userSignature");
    if (localSig) setUserSignature(localSig);

    // Then fallback/sync with API
    const token = localStorage.getItem("token");
    const res = await fetch("/api/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setUserSignature(data.signature);
      if (data.signature) localStorage.setItem("userSignature", data.signature);
    }
  }
  loadUserSignature();
}, []);

    useEffect(() => {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") setPlacingType(null);
  };
  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}, []);


  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

  const pxFromPct = (
    page: number,
    xPct: number,
    yPct: number,
    wPct: number,
    hPct: number
  ) => {
    const rect = pageRects[page];
    if (!rect) return { x: 0, y: 0, w: 160, h: 48 };
    return {
      x: xPct * rect.w,
      y: yPct * rect.h,
      w: Math.max(80, wPct * rect.w),
      h: Math.max(36, hPct * rect.h),
    };
  };

  const pctFromPx = (
    page: number,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const rect = pageRects[page];
    if (!rect) return null;
    return {
      xPct: clamp01(x / rect.w),
      yPct: clamp01(y / rect.h),
      wPct: clamp01(w / rect.w),
      hPct: clamp01(h / rect.h),
    };
  };

  const saveFields = async () => {
    setIsSaving(true);
    try {
      const payload = {
        fields: fields.map((f) => ({
          id: f.id,
          type: f.type,
          page: f.page,
          xPct: f.xPct,
          yPct: f.yPct,
          wPct: f.wPct,
          hPct: f.hPct,
        })),
      };

      const res = await fetch(`/api/meetings/${id}/fields`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(tokenHeader as Record<string, string>),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Failed to save fields");
      }

      return true;
    } catch (e: any) {
      alert(e?.message || "Failed to save fields");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishAndSend = async () => {
    const ok = await saveFields();
    if (!ok) return;

    // OPTIONAL: if you have a send endpoint, call it here.
    // await fetch(`/api/meetings/${id}/send`, { method: "POST", headers: tokenHeader });

    alert("Document prepared and saved!");
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={40} />
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
            Loading Document...
          </p>
        </div>
      </div>
    );
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const storedName =
    meeting?.storedFileName ||
    meeting?.originalFileName ||
    meeting?.fileName ||
    "";

  const isPdf = storedName.toLowerCase().endsWith(".pdf");

  const fileUrl = id ? `/api/meetings/${id}/pdf` : "";


  return (
    <div className="h-screen flex flex-col bg-[#f0f2f5] overflow-hidden">
      {/* Top Navbar */}
      <header className="bg-white border-b px-8 py-3 flex justify-between items-center shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
          >
            <ChevronLeft size={22} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-gray-900">
              {meeting?.title || "Untitled Document"}
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                Prepare Mode
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleFinishAndSend}
          disabled={isSaving || !fileUrl}
          className="bg-[#0015ff] text-white px-8 py-2 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition shadow-lg shadow-blue-200 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Send size={16} />
          )}
          Finish & Send
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-72 bg-white border-r p-6 flex flex-col gap-6 z-40 shadow-xl">
          <div>
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">
              Draggable Fields
            </h3>
            <div className="flex flex-col space-y-3 w-48">
              <button 
                onClick={() => setPlacingType("signature")}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
              >
                Signature
              </button>
              <button 
                onClick={() => setPlacingType("name")}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
              >
                Full Name
              </button>
              <button 
                onClick={() => setPlacingType("date")}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shadow-sm"
              >
                Date Signed
              </button>
            </div>
          </div>

          <div className="mt-auto border-t pt-6">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-4">
              Recipients
            </p>
            <div className="space-y-3">
              {meeting?.participants?.map((p: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">
                    {p?.name?.[0]?.toUpperCase?.() || "?"}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-gray-800 truncate">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {p.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Document Viewer */}
        <main className="flex-1 overflow-auto p-12 flex justify-center bg-[#e2e8f0] relative">
          <div className="w-[850px]">
          
            {!fileUrl ? (
              <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
                No PDF filePath found for this meeting/document.
              </div>
            ) : (
              <PdfRenderer
                fileUrl={fileUrl}
                authToken={token || ""}
                isPdf={isPdf}
                fields={fields}
                setFields={setFields}
                placingType={placingType}
                onPlaced={() => setPlacingType(null)}
                userSignature={userSignature}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
