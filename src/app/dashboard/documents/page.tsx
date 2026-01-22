"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown } from "lucide-react";
import Sidebar from "@/components/Sidebar";

interface Meeting {
  _id: string;
  title: string;
  date: string;
  status: "Draft" | "Sent" | "Completed" | "Prepared";
  participants: { name: string; email: string; signed: boolean; isCurrent?: boolean }[];
  sentAt?: string;
  currentSignerIndex?: number;
}

type FilterType = "All" | "Drafts" | "Completed" | "I Need to Sign";

export default function DocumentList() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch meetings
        const meetingsRes = await fetch("/api/meetings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meetingsData = await meetingsRes.json();
        setMeetings(meetingsData.meetings || []);

        // Fetch user profile to get email
        const profileRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setUserEmail(profileData.email || "");
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getFilteredMeetings = () => {
    switch (activeFilter) {
      case "Drafts":
        return meetings.filter(m => m.status === "Draft");
      case "Completed":
        return meetings.filter(m => m.status === "Completed");
      case "I Need to Sign":
        return meetings.filter(m => 
          m.status === "Sent" && 
          m.participants.some(p => p.email === userEmail && !p.signed)
        );
      default:
        return meetings;
    }
  };

  const filteredMeetings = getFilteredMeetings();

  const filters: FilterType[] = ["All", "Drafts", "Completed", "I Need to Sign"];

  const getStatusBadge = (status: string) => {
    const colors = {
      Draft: 'bg-gray-500',
      Prepared: 'bg-orange-500',
      Sent: 'bg-blue-500',
      Completed: 'bg-emerald-600'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return { month, day, year };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#2d3748] flex">
      <div className="w-64 shrink-0"></div>
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b px-8 py-7.5 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-indigo-900">Document List</h1>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold text-orange-700">SN</div>
          </div>
        </header>

        <main className="flex-1 w-full mx-auto px-8 py-6">
          {/* Filter Tabs */}
          <div className="flex gap-3 mb-6 border-b pb-0">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-6 py-3 text-sm font-medium transition relative cursor-pointer ${
                  activeFilter === filter
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Documents List */}
          <div className="space-y-3">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => {
                const recipients = meeting.participants
                  .map(p => p.name || p.email)
                  .join(", ");
                
                const createdDate = formatDate(meeting.date);
                const statusDate = meeting.sentAt ? formatDate(meeting.sentAt) : null;
                
                return (
                  <div 
                    key={meeting._id} 
                    onClick={() => {
                      if (meeting.status === 'Draft') {
                        router.push(`/dashboard/meetings/${meeting._id}/edit`);
                      } else if (meeting.status === 'Completed' || meeting.status === 'Sent') {
                        router.push(`/view/${meeting._id}`);
                      } else if (meeting.status === 'Prepared') {
                        router.push(`/dashboard/prepare/${meeting._id}`);
                      }
                    }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left section with dates and content */}
                      <div className="flex gap-4 flex-1">
                        {/* Date Badges */}
                        <div className="flex gap-2">
                          {statusDate && (
                            <div className="flex flex-col items-center">
                              <div className={`${getStatusBadge(meeting.status)} text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase`}>
                                {meeting.status}
                              </div>
                              <div className="text-xs font-semibold text-gray-700 mt-1">
                                {statusDate.month} {statusDate.day} {statusDate.year}
                              </div>
                            </div>
                          )}
                          <div className="flex flex-col items-center">
                            <div className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                              {statusDate ? 'Created' : meeting.status}
                            </div>
                            <div className="text-xs font-semibold text-gray-700 mt-1">
                              {createdDate.month} {createdDate.day} {createdDate.year}
                            </div>
                          </div>
                        </div>

                        {/* Document Info */}
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900 mb-1">
                            {meeting.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            To: <span className="text-gray-700">{recipients || "—"}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right section with status badge */}
                      <div className={`${getStatusBadge(meeting.status)} text-white text-xs font-semibold px-4 py-2 rounded uppercase`}>
                        {meeting.status}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-16 text-center">
                <p className="text-sm text-gray-400 italic">
                  No documents found for this filter
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
