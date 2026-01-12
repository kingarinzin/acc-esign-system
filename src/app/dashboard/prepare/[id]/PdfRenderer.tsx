"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { X, MousePointer2, Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

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
      onRect(pageNumber, r.width, r.height);
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
  fileUrl, // /api/meetings/:id/pdf
  authToken,
  isPdf,
  fields,
  setFields,
  placingType,
  onPlaced,
}: {
  fileUrl: string;
  authToken: string;
  isPdf: boolean;
  fields: Field[];
  setFields: React.Dispatch<React.SetStateAction<Field[]>>;
  placingType: FieldType | null;
  onPlaced: () => void;
}) {
  const [numPages, setNumPages] = useState(0);
  const [pageRects, setPageRects] = useState<Record<number, PageRect>>({});
  const [blobUrl, setBlobUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }, []);

  const absoluteUrl = useMemo(() => {
    if (!fileUrl) return "";
    return fileUrl.startsWith("http")
      ? fileUrl
      : new URL(fileUrl, window.location.origin).toString();
  }, [fileUrl]);

  // Fetch PDF as blob using POST to avoid IDM interception
  useEffect(() => {
    let alive = true;
    let localBlobUrl = "";

    async function run() {
      if (!absoluteUrl) return;
      if (!authToken) {
        setErrMsg("Missing auth token.");
        return;
      }

      setLoading(true);
      setErrMsg("");

      try {
        const res = await fetch(absoluteUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
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

  const removeField = (fieldId: string) => {
    setFields((prev) => prev.filter((f) => f.id !== fieldId));
  };

  if (!fileUrl) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
        No file URL found.
      </div>
    );
  }

  if (!isPdf) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
        This document is not a PDF. Prepare mode currently supports PDFs only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Loader2 className="animate-spin" />
        Loading PDF...
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
        {errMsg}
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
        Failed to create blob URL.
      </div>
    );
  }

  const FIELD_PNG: Record<FieldType, string> = {
    signature: "/field-templates/signature.png",
    name: "/field-templates/name.png",
    date: "/field-templates/date.png",
  };

  return (
    <Document
      file={blobUrl}
      onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
      loading={
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" />
          Rendering PDF...
        </div>
      }
      error={
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-200 text-gray-600">
          Failed to render PDF.
        </div>
      }
    >
      {Array.from({ length: numPages }, (_, index) => {
        const pageNumber = index + 1;

        return (
          <div key={pageNumber} className="mb-10">
            <PageWrapper
              pageNumber={pageNumber}
              placingType={placingType}
              onRect={(page, w, h) =>
                setPageRects((prev) => ({ ...prev, [page]: { w, h } }))
              }
              onPlace={(pg, xPct, yPct) => {
                if (!placingType) return;

                const defaults =
                  placingType === "signature"
                    ? { wPct: 0.28, hPct: 0.09 }
                    : placingType === "name"
                    ? { wPct: 0.28, hPct: 0.07 }
                    : { wPct: 0.22, hPct: 0.07 };

                setFields((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(),
                    type: placingType,
                    page: pg,
                    xPct,
                    yPct,
                    ...defaults,
                  },
                ]);

                onPlaced(); // exit placing mode
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
                    const rect = pxFromPct(
                      field.page,
                      field.xPct,
                      field.yPct,
                      field.wPct,
                      field.hPct
                    );

                    const colorClasses =
                      field.type === "signature"
                        ? "border-orange-400 text-orange-700"
                        : field.type === "name"
                        ? "border-blue-400 text-blue-700"
                        : "border-green-400 text-green-700";

                    return (
                      <Rnd
                        key={field.id}
                        size={{ width: rect.w, height: rect.h }}
                        position={{ x: rect.x, y: rect.y }}
                        bounds="parent"
                        className="pointer-events-auto"
                        onDragStop={(_e, d) => {
                          const current = pxFromPct(
                            field.page,
                            field.xPct,
                            field.yPct,
                            field.wPct,
                            field.hPct
                          );
                          const pct = pctFromPx(
                            field.page,
                            d.x,
                            d.y,
                            current.w,
                            current.h
                          );
                          if (!pct) return;
                          setFields((prev) =>
                            prev.map((f) =>
                              f.id === field.id ? { ...f, ...pct } : f
                            )
                          );
                        }}
                        onResizeStop={(_e, _dir, ref, _delta, position) => {
                          const w = ref.offsetWidth;
                          const h = ref.offsetHeight;
                          const pct = pctFromPx(
                            field.page,
                            position.x,
                            position.y,
                            w,
                            h
                          );
                          if (!pct) return;
                          setFields((prev) =>
                            prev.map((f) =>
                              f.id === field.id ? { ...f, ...pct } : f
                            )
                          );
                        }}
                      >
                        <div className="w-full h-full group relative pointer-events-auto">
                          <img
                            src={FIELD_PNG[field.type]}
                            alt={field.type}
                            draggable={false}
                            className="w-full h-full object-contain select-none"
                          />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            className="absolute -top-2 -right-2 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-md border p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
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
