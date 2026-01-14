"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Rnd } from "react-rnd";
import { X, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

// Set worker outside to ensure it only runs once
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FieldType = "signature" | "name" | "date";

export interface Field {
  id: string;
  type: FieldType;
  page: number;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
}

type PageRect = { w: number; h: number };

function PageWrapper({
  pageNumber,
  children,
  onRect,
  placingType,
  onPlace,
}: {
  pageNumber: number;
  children: React.ReactNode;
  onRect: (page: number, w: number, h: number) => void;
  placingType: FieldType | null;
  onPlace: (page: number, xPct: number, yPct: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const r = node.getBoundingClientRect();
      onRect(pageNumber, Math.round(r.width), Math.round(r.height));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(node);
    return () => ro.disconnect();
  }, [pageNumber, onRect]);

  return (
    <div
      ref={ref}
      className={`relative bg-white shadow-2xl border border-gray-300 ${
        placingType ? "cursor-crosshair" : ""
      }`}
      onClick={(e) => {
        if (!placingType) return;
        const node = ref.current;
        if (!node) return;

        const r = node.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;

        const xPct = Math.min(1, Math.max(0, x / r.width));
        const yPct = Math.min(1, Math.max(0, y / r.height));

        onPlace(pageNumber, xPct, yPct);
      }}
    >
      {children}
    </div>
  );
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export default function PdfRenderer({
  fileUrl,
  authToken,
  isPdf,
  fields,
  setFields,
  placingType,
  onPlaced,
  userSignature,
  userName, // <-- Added userName prop
}: {
  fileUrl: string;
  authToken: string;
  isPdf: boolean;
  fields: Field[];
  setFields: React.Dispatch<React.SetStateAction<Field[]>>;
  placingType: FieldType | null;
  onPlaced: () => void;
  userSignature: string | null;
  userName?: string; // <-- Added optional prop
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageRects, setPageRects] = useState<Record<number, PageRect>>({});
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const absoluteUrl = useMemo(() => {
    if (!fileUrl) return "";
    return fileUrl.startsWith("http")
      ? fileUrl
      : new URL(fileUrl, window.location.origin).toString();
  }, [fileUrl]);

  const handlePageRect = useCallback((page: number, w: number, h: number) => {
    setPageRects((prev) => {
      if (prev[page]?.w === w && prev[page]?.h === h) return prev;
      return { ...prev, [page]: { w, h } };
    });
  }, []);

  useEffect(() => {
    let alive = true;
    let localBlobUrl = "";

    async function run() {
      if (!absoluteUrl || !authToken) return;
      setLoading(true);
      try {
        const res = await fetch(absoluteUrl, {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error(`PDF fetch failed (${res.status})`);
        const blob = await res.blob();
        localBlobUrl = URL.createObjectURL(blob);
        if (alive) setBlobUrl(localBlobUrl);
      } catch (e: any) {
        if (alive) setErrMsg(e?.message || "Failed to fetch PDF");
      } finally {
        if (alive) setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [absoluteUrl, authToken]);

  const pxFromPct = (page: number, xPct: number, yPct: number, wPct: number, hPct: number) => {
    const rect = pageRects[page];
    if (!rect) return { x: 0, y: 0, w: 160, h: 48 };
    return {
      x: xPct * rect.w,
      y: yPct * rect.h,
      w: Math.max(80, wPct * rect.w),
      h: Math.max(36, hPct * rect.h),
    };
  };

  const pctFromPx = (page: number, x: number, y: number, w: number, h: number) => {
    const rect = pageRects[page];
    if (!rect) return null;
    return {
      xPct: clamp01(x / rect.w),
      yPct: clamp01(y / rect.h),
      wPct: clamp01(w / rect.w),
      hPct: clamp01(h / rect.h),
    };
  };

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  if (!fileUrl) return <div className="p-10 text-gray-600">No file URL found.</div>;
  if (!isPdf) return <div className="p-10 text-gray-600">Prepare mode supports PDFs only.</div>;
  if (loading) return <div className="flex items-center gap-3 p-10"><Loader2 className="animate-spin" /> Loading PDF...</div>;
  if (errMsg) return <div className="p-10 text-red-600">{errMsg}</div>;

  const FIELD_PNG: Record<FieldType, string> = {
    signature: "/field-templates/signature.png",
    name: "/field-templates/name.png",
    date: "/field-templates/date.png",
  };

  // Helper to get formatted current date
  const todayDate = new Date().toLocaleDateString();

  return (
    <Document
      file={blobUrl}
      onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
      loading={<div className="flex items-center gap-3"><Loader2 className="animate-spin" /> Rendering PDF...</div>}
    >
      {Array.from({ length: numPages }, (_, index) => {
        const pageNumber = index + 1;
        return (
          <div key={pageNumber} className="mb-10">
            <PageWrapper
              pageNumber={pageNumber}
              placingType={placingType}
              onRect={handlePageRect}
              onPlace={(pg, xPct, yPct) => {
                if (!placingType) return;
                const defaults = placingType === "signature" 
                  ? { wPct: 0.28, hPct: 0.09 } 
                  : placingType === "name" 
                  ? { wPct: 0.28, hPct: 0.07 } 
                  : { wPct: 0.22, hPct: 0.07 };

                setFields((prev) => [...prev, {
                  id: crypto.randomUUID(),
                  type: placingType,
                  page: pg,
                  xPct,
                  yPct,
                  ...defaults,
                }]);
                onPlaced();
              }}
            >
              <Page
                pageNumber={pageNumber}
                width={850}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />

              <div className="absolute inset-0 z-10 pointer-events-none">
                {fields
                  .filter((f) => f.page === pageNumber)
                  .map((field) => {
                    const rect = pxFromPct(field.page, field.xPct, field.yPct, field.wPct, field.hPct);
                    
                    // Logic to decide content: Image for signature, Text for others
                    const isSignature = field.type === "signature";
                    const fieldText = field.type === "name" ? (userName || "Full Name") : todayDate;

                    return (
                      <Rnd
                        key={field.id}
                        size={{ width: rect.w, height: rect.h }}
                        position={{ x: rect.x, y: rect.y }}
                        bounds="parent"
                        className="pointer-events-auto"
                        onDragStop={(_e, d) => {
                          const pct = pctFromPx(field.page, d.x, d.y, rect.w, rect.h);
                          if (pct) setFields((prev) => prev.map((f) => f.id === field.id ? { ...f, ...pct } : f));
                        }}
                        onResizeStop={(_e, _dir, ref, _delta, position) => {
                          const pct = pctFromPx(field.page, position.x, position.y, ref.offsetWidth, ref.offsetHeight);
                          if (pct) setFields((prev) => prev.map((f) => f.id === field.id ? { ...f, ...pct } : f));
                        }}
                      >
                        <div className="w-full h-full group relative flex items-center justify-center border border-transparent hover:border-blue-400 rounded transition-colors bg-white/10">
                          {isSignature ? (
                            <img
                              src={userSignature ? userSignature : FIELD_PNG.signature}
                              alt="signature"
                              className="w-full h-full object-contain select-none"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center px-2">
                                <span 
                                    className="text-gray-900 font-medium whitespace-nowrap overflow-hidden select-none"
                                    style={{ fontSize: `calc(${rect.h}px * 0.4)` }}
                                >
                                    {fieldText}
                                </span>
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                            className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-md border p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </Rnd>
                    );
                  })}
              </div>
            </PageWrapper>
          </div>
        );
      })}
    </Document>
  );
}