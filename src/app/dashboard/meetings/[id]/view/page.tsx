"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Participant {
  name: string;
  email: string;
  signed?: boolean;
}

interface Meeting {
  _id: string;
  title: string;
  date: string;
  description: string;
  participants: Participant[];
  fileName?: string;
  filePath?: string;
  status: "Draft" | "Prepared" | "Sent" | "Signed";
}

interface PageProps {
  params: { id: string };
}

export default function ViewMeetingPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setMeeting(data.meeting);
        } else {
          setMessage(data.error || "Failed to load meeting");
        }
      } catch (err) {
        console.error(err);
        setMessage("Server error");
      } finally {
        setLoading(false);
      }
    }

    fetchMeeting();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!meeting) return <p className="p-6 text-red-500">{message || "Meeting not found"}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-4">{meeting.title}</h2>
        <p className="mb-2"><strong>Date:</strong> {new Date(meeting.date).toLocaleDateString()}</p>
        <p className="mb-4"><strong>Description:</strong> {meeting.description}</p>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Participants</h3>
          <ul>
            {meeting.participants.map((p) => (
              <li key={p.email}>
                {p.name} ({p.email}) {p.signed ? "- Signed" : "- Pending"}
              </li>
            ))}
          </ul>
        </div>

        {meeting.filePath && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Document</h3>
            {meeting.fileName?.endsWith(".pdf") ? (
              <iframe
                src={meeting.filePath}
                className="w-full h-96 border"
                title="Document Preview"
              />
            ) : (
              <p>
                <a href={meeting.filePath} target="_blank" className="text-blue-600 underline">
                  {meeting.fileName}
                </a>
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition"
            onClick={() => router.push(`/dashboard/meetings/${id}/sign`)}
          >
            Proceed to Sign
          </button>
          <button
            className="flex-1 bg-gray-400 text-white py-3 rounded-xl hover:bg-gray-500 transition"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
