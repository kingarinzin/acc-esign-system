"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function AccOagReferralPage() {
  const [referrals, setReferrals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    case_no: "",
    case_description: "",
    investigator_detail: "",
    status: "Pending",
    referral_date: "",
  });

  // ================== FETCH ==================
  const fetchReferrals = async () => {
    try {
      const res = await fetch("/api/acc-oag-referrals");
      const data = await res.json();
      setReferrals(Array.isArray(data) ? data : []);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  // ================== FORM HANDLERS ==================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      case_no: "",
      case_description: "",
      investigator_detail: "",
      status: "Pending",
      referral_date: "",
    });
    setEditData(null);
    setShowForm(false);
  };

  // ================== ADD / UPDATE ==================
  const handleAddOrUpdate = async () => {
    if (!formData.case_no || !formData.case_description) {
      showNotification("Case No and Case Description are required", "error");
      return;
    }

    try {
      const url = "/api/acc-oag-referrals";
      const method = editData ? "PUT" : "POST";
      const body = { ...formData, ...(editData ? { _id: editData._id } : {}) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");

      await fetchReferrals();
      resetForm();
      showNotification(editData ? "Referral updated successfully" : "Referral added successfully");
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  // ================== EDIT ==================
  const handleEdit = (ref) => {
    setEditData(ref);
    setFormData({
      case_no: ref.case_no,
      case_description: ref.case_description,
      investigator_detail: ref.investigator_detail,
      status: ref.status || "Pending",
      referral_date: ref.referral_date?.split("T")[0] || "",
    });
    setShowForm(true);
  };

  // ================== DELETE ==================
  const handleDelete = async (ref) => {
    if (!confirm(`Are you sure you want to delete "${ref.case_no}"?`)) return;

    try {
      const res = await fetch("/api/acc-oag-referrals", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: ref._id }),
      });
      if (!res.ok) throw new Error("Failed to delete");

      await fetchReferrals();
      showNotification("Referral deleted successfully");
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  // ================== SEARCH & PAGINATION ==================
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const filteredReferrals = referrals.filter((r) =>
    r.case_no?.toLowerCase().includes(search.toLowerCase()) ||
    r.case_description?.toLowerCase().includes(search.toLowerCase()) ||
    r.investigator_detail?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReferrals.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedReferrals = filteredReferrals.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ACC - OAG Referral</h1>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">+ Add Referral</button>
          )}
        </div>

        {notification && (
          <div className={`mb-4 px-4 py-2 rounded ${notification.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {notification.message}
          </div>
        )}

        {/* ================== SEARCH & ROWS PER PAGE ================== */}
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by Case No, Description, or Investigator"
            value={search}
            onChange={handleSearchChange}
            className="w-full md:w-1/3 border rounded px-3 py-2"
          />
          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select value={rowsPerPage} onChange={handleRowsChange} className="border rounded px-2 py-1">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">{editData ? "Edit Referral" : "Add Referral"}</h2>
              <button onClick={resetForm} className="text-xl text-gray-500">✕</button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label>Case No</label>
                <input type="text" name="case_no" value={formData.case_no} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label>Case Description</label>
                <input type="text" name="case_description" value={formData.case_description} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label>Investigator Detail</label>
                <input type="text" name="investigator_detail" value={formData.investigator_detail} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label>Referral Date</label>
                <input type="date" name="referral_date" value={formData.referral_date} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={resetForm} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleAddOrUpdate} className="px-4 py-2 bg-blue-600 text-white rounded">{editData ? "Update" : "Save"}</button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">S/N</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase cursor-pointer">Case No</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase cursor-pointer">Case Description</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase cursor-pointer">Investigator Detail</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase cursor-pointer">Referral Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedReferrals.length > 0 ? paginatedReferrals.map((r, i) => (
                <tr key={r._id} className="hover:bg-gray-100">
                  <td className="px-6 py-3 text-sm">{startIndex + i + 1}</td>
                  <td className="px-6 py-3 text-sm">{r.case_no}</td>
                  <td className="px-6 py-3 text-sm">{r.case_description}</td>
                  <td className="px-6 py-3 text-sm">{r.investigator_detail}</td>
                  <td className="px-6 py-3 text-sm">{r.status}</td>
                  <td className="px-6 py-3 text-sm">{r.referral_date?.split("T")[0]}</td>
                  <td className="px-6 py-3 text-sm flex gap-2">
                    <button onClick={() => handleEdit(r)} className="px-2 py-1 bg-yellow-500 text-white rounded">Edit</button>
                    <button onClick={() => handleDelete(r)} className="px-2 py-1 bg-red-500 text-white rounded">Delete</button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-3 text-center">No referrals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-5 text-sm">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className={`font-semibold text-lg ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600"}`}
            >
              &lt;
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className={`font-semibold text-lg ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "hover:text-blue-600"}`}
            >
              &gt;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}