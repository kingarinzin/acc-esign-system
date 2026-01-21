"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Document, Page, pdfjs } from "react-pdf";
import { Loader2, Send, PenTool, CheckCircle2, Trash2 } from "lucide-react";
import { Rnd } from "react-rnd";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SigningView({
  meeting,
  meetingId,
  currentUser,
}: {
  meeting: any;
  meetingId: string;
  currentUser: any;
}) {
  const router = useRouter();
  const [numPages, setNumPages] = useState(0);
  const [blobUrl, setBlobUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pageRects, setPageRects] = useState<Record<number, { width: number; height: number }>>({});
  const [placedSignatures, setPlacedSignatures] = useState<Record<string, boolean>>({});
  const [freeformSignatures, setFreeformSignatures] = useState<Array<{
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>>([]);
  const [isDraggingSignature, setIsDraggingSignature] = useState(false);

  // Fetch PDF
  useEffect(() => {
    async function fetchPdf() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${meetingId}/pdf`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch PDF");

        const blob = await res.blob();
        setBlobUrl(URL.createObjectURL(blob));
      } catch (err) {
        console.error("Error fetching PDF:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();
  }, [meetingId]);

  // Load user's signature if exists
  useEffect(() => {
    async function loadSignature() {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.signature) {
          setUserSignature(data.signature);
          setHasDrawnSignature(true);
        }
      }
    }
    loadSignature();
  }, []);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasDrawnSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const saveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    setUserSignature(dataUrl);

    // Save to user profile
    const token = localStorage.getItem("token");
    await fetch("/api/user/update-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ signature: dataUrl }),
    });
  };

  const handleSign = async () => {
    // Check if at least one signature is placed (either in field or freeform)
    const mySignatureFields = myFields.filter((f: any) => f.type === 'signature');
    const hasFieldSignatures = mySignatureFields.every((f: any) => placedSignatures[f.id]);
    const hasFreeformSignatures = freeformSignatures.length > 0;
    
    if (!hasFieldSignatures && !hasFreeformSignatures) {
      alert("Please place your signature on the document before submitting");
      return;
    }

    // Strong validation - must have signature
    const finalSignature = userSignature || (hasDrawnSignature ? canvasRef.current?.toDataURL("image/png") : null);
    
    if (!finalSignature) {
      alert("Please create your signature before signing the document");
      return;
    }

    // Save signature if drawn but not saved
    if (hasDrawnSignature && !userSignature) {
      await saveSignature();
    }

    setSigning(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/meetings/${meetingId}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          signature: finalSignature,
          signaturePositions: freeformSignatures, // Include where signatures were placed
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign");
      }

      const data = await res.json();
      
      // Show success message
      alert(data.message || "Document signed successfully!");
      
      // Always redirect to dashboard after signing
      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message || "Failed to sign document");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  // Find fields assigned to current user
  const myFields = meeting.fields?.filter((f: any) => {
    const recipientName = f.recipientName?.toLowerCase();
    const userName = currentUser.name?.toLowerCase();
    const userEmail = currentUser.email?.toLowerCase();
    
    return recipientName === userName || recipientName === userEmail;
  }) || [];

  // Get all participants who have already signed with their signature positions
  const signedParticipants = meeting.participants?.filter((p: any) => p.signed) || [];
  
  // Collect all previous signatures to display
  const previousSignatures: Array<{
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    signature: string;
    signerName: string;
  }> = [];
  
  signedParticipants.forEach((p: any) => {
    if (p.signaturePositions && Array.isArray(p.signaturePositions)) {
      p.signaturePositions.forEach((pos: any) => {
        previousSignatures.push({
          ...pos,
          signature: p.signature,
          signerName: p.name || p.email,
        });
      });
    }
  });

  // Drag handlers
  const handleDragStart = (e: React.DragEvent) => {
    if (!userSignature) {
      e.preventDefault();
      alert("Please create or draw your signature first");
      return;
    }
    setIsDraggingSignature(true);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", "signature");
  };

  const handleDragEnd = () => {
    setIsDraggingSignature(false);
  };

  const handleDragOverPage = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDraggingSignature) {
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDropOnPage = (e: React.DragEvent, pageNum: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userSignature || !isDraggingSignature) return;
    
    setIsDraggingSignature(false);

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add signature at dropped position with unique ID
    setFreeformSignatures(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        page: pageNum,
        x: x - 70, // Center signature at cursor (assuming 140px width)
        y: y - 25, // Center signature at cursor (assuming 50px height)
        width: 140,
        height: 50,
      }
    ]);
  };

  const handleDragOver = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setPlacedSignatures(prev => ({ ...prev, [fieldId]: true }));
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-sm text-gray-500">Ready for your signature</p>
          </div>
          <button
            onClick={handleSign}
            disabled={signing || (!userSignature && !hasDrawnSignature)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {signing ? (
              <><Loader2 className="animate-spin" size={16} /> Signing...</>
            ) : (
              <><Send size={16} /> Sign & Submit</>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left: Signature Pad */}
        <aside className="w-80 bg-white border-r p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-600" />
              Your Signature
            </h3>
            
            {userSignature ? (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div 
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  className="cursor-move hover:bg-gray-100 rounded border-2 border-dashed border-blue-300 p-2"
                >
                  <img src={userSignature} alt="Your signature" className="w-full h-24 object-contain pointer-events-none" />
                  <p className="text-xs text-center text-blue-600 font-medium mt-2">
                    ⬆️ Drag to signature fields
                  </p>
                </div>
                <button
                  onClick={() => setUserSignature(null)}
                  className="mt-3 w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create New Signature
                </button>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={120}
                  className="bg-white cursor-crosshair border-b touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <div className="bg-gray-50 p-3 flex gap-2">
                  <button
                    onClick={clearSignature}
                    className="flex-1 text-xs bg-white border rounded py-1.5 hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignature}
                    disabled={!hasDrawnSignature}
                    className="flex-1 text-xs bg-blue-600 text-white rounded py-1.5 hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Document Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Title:</span>
                <p className="font-medium">{meeting.title}</p>
              </div>
              <div>
                <span className="text-gray-500">Your fields:</span>
                <p className="font-medium">{myFields.length} field(s)</p>
              </div>
            </div>
          </div>

          {(userSignature || hasDrawnSignature) && (
            <div className="mt-auto bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-green-800">Ready to Sign</p>
                <p className="text-green-700 text-xs mt-1">
                  Click "Sign & Submit" to complete your signature
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Right: Document Preview */}
        <main className="flex-1 overflow-auto p-8 flex justify-center bg-[#e2e8f0]">
          <div className="max-w-3xl">
            {blobUrl && (
              <Document
                file={blobUrl}
                onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                loading={<Loader2 className="animate-spin" />}
              >
                {Array.from({ length: numPages }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <div 
                      key={pageNum} 
                      className="mb-6 shadow-xl relative"
                      onDragOver={handleDragOverPage}
                      onDrop={(e) => handleDropOnPage(e, pageNum)}
                    >
                      <Page
                        pageNumber={pageNum}
                        width={700}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onLoadSuccess={(page) => {
                          setPageRects(prev => ({
                            ...prev,
                            [pageNum]: { width: page.width, height: page.height }
                          }));
                        }}
                      />
                      {/* Show ALL fields for this page with recipient names */}
                      {meeting.fields
                        ?.filter((f: any) => f.page === pageNum)
                        .map((field: any, idx: number) => {
                          const isMyField = myFields.some((mf: any) => mf.id === field.id);
                          const isSigned = placedSignatures[field.id];
                          
                          // Find participant who owns this field
                          // Match by recipientName against participant name or email
                          const fieldRecipient = field.recipientName?.toLowerCase() || '';
                          const fieldOwner = meeting.participants?.find((p: any) => {
                            const pName = p.name?.toLowerCase() || '';
                            const pEmail = p.email?.toLowerCase() || '';
                            return fieldRecipient === pName || fieldRecipient === pEmail || 
                                   pName.includes(fieldRecipient) || fieldRecipient.includes(pName);
                          });
                          const ownerSigned = fieldOwner?.signed;

                          // Display name - prefer field recipientName, fallback to owner name
                          const displayName = field.recipientName || fieldOwner?.name || 'Pending';

                          return (
                            <div
                              key={field.id || idx}
                              className={`absolute border-2 rounded ${
                                isMyField && !isSigned
                                  ? 'border-blue-500 bg-blue-100 bg-opacity-30'
                                  : ownerSigned
                                  ? 'border-green-500 bg-green-100 bg-opacity-20'
                                  : 'border-gray-400 bg-gray-100 bg-opacity-20'
                              }`}
                              style={{
                                left: `${field.xPct * 100}%`,
                                top: `${field.yPct * 100}%`,
                                width: `${field.wPct * 100}%`,
                                height: `${field.hPct * 100}%`,
                              }}
                              onDragOver={(e) => isMyField && !isSigned && handleDragOver(e, field.id)}
                              onDrop={(e) => isMyField && !isSigned && handleDrop(e, field.id)}
                            >
                              {/* Show recipient name label only for unsigned signature fields */}
                              {!ownerSigned && field.type === 'signature' && (
                                <div className="absolute top-1 left-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-700 bg-opacity-80 text-white z-10">
                                  {displayName}
                                </div>
                              )}
                              
                              {/* Show signature if placed or already signed */}
                              {field.type === 'signature' && (
                                isSigned && userSignature ? (
                                  <div className="w-full h-full flex items-center justify-center p-1">
                                    <img 
                                      src={userSignature} 
                                      alt="Your signature" 
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : ownerSigned && fieldOwner.signature ? (
                                  <div className="w-full h-full flex items-center justify-center p-1">
                                    <img 
                                      src={fieldOwner.signature} 
                                      alt="Signature" 
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-xs text-gray-500 italic">
                                    {isMyField ? 'Drop signature' : ''}
                                  </div>
                                )
                              )}
                              
                              {/* Show name if field type is name */}
                              {field.type === 'name' && (
                                <div className="flex items-center justify-center h-full text-sm font-semibold text-gray-800 px-2">
                                  {ownerSigned ? fieldOwner.name : (isMyField ? currentUser.name : displayName)}
                                </div>
                              )}
                              
                              {/* Show date if field type is date */}
                              {field.type === 'date' && (
                                <div className="flex items-center justify-center h-full text-xs text-gray-700 px-2">
                                  {ownerSigned 
                                    ? new Date(fieldOwner.signedAt).toLocaleDateString()
                                    : (isMyField ? new Date().toLocaleDateString() : new Date().toLocaleDateString())
                                  }
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                      {/* Show previous signers' signatures (read-only) */}
                      {previousSignatures
                        .filter(sig => sig.page === pageNum)
                        .map((sig) => (
                          <div
                            key={sig.id}
                            className="absolute border-2 border-green-500 rounded bg-white shadow-lg"
                            style={{
                              left: `${sig.x}px`,
                              top: `${sig.y}px`,
                              width: `${sig.width}px`,
                              height: `${sig.height}px`,
                            }}
                          >
                            <img 
                              src={sig.signature} 
                              alt="signature" 
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        ))}
                      
                      {/* Show freeform signatures dropped anywhere */}
                      {freeformSignatures
                        .filter(sig => sig.page === pageNum)
                        .map((sig) => (
                          <Rnd
                            key={sig.id}
                            size={{ width: sig.width, height: sig.height }}
                            position={{ x: sig.x, y: sig.y }}
                            bounds="parent"
                            disableDragging={isDraggingSignature}
                            onDragStop={(e, d) => {
                              setFreeformSignatures(prev =>
                                prev.map(s => s.id === sig.id ? { ...s, x: d.x, y: d.y } : s)
                              );
                            }}
                            onResizeStop={(e, dir, ref, delta, position) => {
                              setFreeformSignatures(prev =>
                                prev.map(s => s.id === sig.id ? {
                                  ...s,
                                  x: position.x,
                                  y: position.y,
                                  width: ref.offsetWidth,
                                  height: ref.offsetHeight,
                                } : s)
                              );
                            }}
                          >
                            <div className="w-full h-full border-2 border-blue-500 rounded bg-white shadow-lg group relative">
                              <img 
                                src={userSignature || ''} 
                                alt="signature" 
                                className="w-full h-full object-contain p-1 pointer-events-none"
                              />
                              <button
                                onClick={() => setFreeformSignatures(prev => prev.filter(s => s.id !== sig.id))}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove signature"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </Rnd>
                        ))}
                    </div>
                  );
                })}
              </Document>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
