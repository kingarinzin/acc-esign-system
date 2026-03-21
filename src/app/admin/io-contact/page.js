"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

export default function IoContactPage() {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    remarks: "",
  });

  // ================== FETCH ==================
  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/io-contacts");
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // ================== FORM HANDLER ==================
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
      name: "",
      phone_number: "",
      remarks: "",
    });
    setEditData(null);
    setShowForm(false);
  };

  // ================== ADD / UPDATE ==================
  const handleAddOrUpdate = async () => {
    if (!formData.name || !formData.phone_number) {
      showNotification("Name and Phone Number are required", "error");
      return;
    }

    try {
      const url = "/api/io-contacts";
      const method = editData ? "PUT" : "POST";

      const body = {
        ...formData,
        ...(editData ? { _id: editData._id } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      await fetchContacts();
      resetForm();
      showNotification(
        editData ? "Contact updated successfully" : "Contact added successfully"
      );
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  // ================== EDIT ==================
  const handleEdit = (contact) => {
    setEditData(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      remarks: contact.remarks,
    });
    setShowForm(true);
  };

  // ================== DELETE ==================
  const handleDelete = async (contact) => {
    if (!confirm(`Are you sure you want to delete "${contact.name}"?`)) return;

    try {
      const res = await fetch("/api/io-contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: contact._id }),
      });

      if (!res.ok) throw new Error("Failed to delete");

      await fetchContacts();
      showNotification("Contact deleted successfully");
    } catch (error) {
      showNotification(error.message, "error");
    }
  };

  // ================== SEARCH ==================
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.remarks?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedContacts = filteredContacts.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-6 ml-64 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">IO Contact List</h1>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              + Add Contact
            </button>
          )}
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-4 px-4 py-2 rounded ${
              notification.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Search + Rows */}
        <div className="flex justify-between items-center mb-4">
          <input
            type="text"
            placeholder="Search by Name, Phone, or Remarks"
            value={search}
            onChange={handleSearchChange}
            className="w-full md:w-1/3 border rounded px-3 py-2"
          />

          <div className="flex items-center gap-2 text-sm">
            <span>Show</span>
            <select
              value={rowsPerPage}
              onChange={handleRowsChange}
              className="border rounded px-2 py-1"
            >
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
              <h2 className="text-lg font-semibold">
                {editData ? "Edit Contact" : "Add Contact"}
              </h2>
              <button onClick={resetForm} className="text-xl text-gray-500">
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label>Remarks</label>
                <input
                  type="text"
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={resetForm}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {editData ? "Update" : "Save"}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  S/N
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  Phone Number
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedContacts.length > 0 ? (
                paginatedContacts.map((c, i) => (
                  <tr key={c._id} className="hover:bg-gray-100">
                    <td className="px-6 py-3 text-sm">
                      {startIndex + i + 1}
                    </td>
                    <td className="px-6 py-3 text-sm">{c.name}</td>
                    <td className="px-6 py-3 text-sm">{c.phone_number}</td>
                    <td className="px-6 py-3 text-sm">{c.remarks}</td>
                    <td className="px-6 py-3 text-sm flex gap-2">
                      <button
                        onClick={() => handleEdit(c)}
                        className="px-2 py-1 bg-yellow-500 text-white rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="px-2 py-1 bg-red-500 text-white rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-3 text-center">
                    No contacts found.
                  </td>
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
              className={`font-semibold text-lg ${
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:text-blue-600"
              }`}
            >
              &lt;
            </button>

            <span>
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className={`font-semibold text-lg ${
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:text-blue-600"
              }`}
            >
              &gt;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}