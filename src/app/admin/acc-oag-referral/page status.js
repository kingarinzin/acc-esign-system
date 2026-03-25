"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { FaEdit, FaTrash, FaEye } from "react-icons/fa";


export default function AccOagReferralPage() {
  const [referrals, setReferrals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  
  const [expandedRow, setExpandedRow] = useState(null);   //For view expand in the list.   . 
  const [isEditingStatus, setEditingStatusId] = useState(null); //for edit drop down
  const [user, setUser] = useState(null);
        useEffect(() => {
        const fetchUser = async () => {
          const token = localStorage.getItem("token");

          if (!token) return;

          try {
            const res = await fetch("/api/me", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const data = await res.json();

            if (res.ok) {
              //setUserRole(data.role);
              setUser(data);
            } else {
              console.error(data.error);
            }
          } catch (err) {
            console.error("Failed to fetch user:", err);
          }
        };

        fetchUser();
      }, []);

  const [formData, setFormData] = useState({
    case_no: "",
    case_description: "",
    investigator_detail: "",
    status: "Pending",
    referral_date: "",
    accused_details: [
      {
        name: "",
        cid: "",
        act_charges: "",
        prayer: "",
        counts: "",
      },
    ],
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

  // ================== UpdateStatus ==================

const updateStatus = async (id, newStatus) => {
  console.log("Updating:", id, newStatus); // 👈 DEBUG

  const token = localStorage.getItem("token");

  const res = await fetch("/api/acc-oag-referrals/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      _id: id,
      status: newStatus,
    }),
  });

  const data = await res.json();
  console.log("API Response:", data); // 👈 DEBUG

  if (!res.ok) {
    alert(data.error);
    return;
  }

  setReferrals((prev) =>
    prev.map((item) =>
      item._id === id ? { ...item, status: newStatus } : item
    )
  );
};




  

  // ================== FORM HANDLERS ==================
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAccusedChange = (index, field, value) => {
    const updated = [...formData.accused_details];
    updated[index][field] = value;
    setFormData({ ...formData, accused_details: updated });
  };

  const addAccusedRow = () => {
    setFormData({
      ...formData,
      accused_details: [
        ...formData.accused_details,
        { name: "", cid: "", act_charges: "", prayer: "", counts: "" },
      ],
    });
  };

  const removeAccusedRow = (index) => {
    const updated = formData.accused_details.filter((_, i) => i !== index);
    setFormData({ ...formData, accused_details: updated });
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
      accused_details: [
        { name: "", cid: "", act_charges: "", prayer: "", counts: "" },
      ],
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
      const token = localStorage.getItem("token"); // 🔥 get token
      const url = "/api/acc-oag-referrals";
      const method = editData ? "PUT" : "POST";
      const body = { ...formData, ...(editData ? { _id: editData._id } : {}) };

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔥 REQUIRED
         },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save");

      await fetchReferrals();
      resetForm();
      showNotification(
        editData ? "Referral updated successfully" : "Referral added successfully"
      );
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
      accused_details: ref.accused_details?.length
        ? ref.accused_details
        : [{ name: "", cid: "", act_charges: "", prayer: "", counts: "" }],
    });
    setShowForm(true);
  };

  // ================== DELETE ==================
  const handleDelete = async (ref) => {
  if (!confirm(`Are you sure you want to delete "${ref.case_no}"?`)) return;

  try {
    const token = localStorage.getItem("token"); // or wherever you store it

    const res = await fetch("/api/acc-oag-referrals", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ REQUIRED
      },
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

  const filteredReferrals = referrals.filter(
    (r) =>
      r.case_no?.toLowerCase().includes(search.toLowerCase()) ||
      r.case_description?.toLowerCase().includes(search.toLowerCase()) ||
      r.investigator_detail?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReferrals.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedReferrals = filteredReferrals.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const userRole = user?.role;
  //console.log("Full user:", user);
  //console.log("User Role:", userRole);

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 ml-64 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">ACC - OAG Referral</h1>
          {!showForm && userRole && userRole === "ACC_USER" && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              + Add Referral
            </button>
          )}
        </div>

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

        {/* FORM */}
        {showForm && (
          <div className="bg-white shadow rounded-xl p-6 mb-6">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editData ? "Edit Referral" : "Add Referral"}
              </h2>
              <button onClick={resetForm} className="text-xl text-gray-500">
                ✕
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label>Case No</label>
                <input
                  type="text"
                  name="case_no"
                  value={formData.case_no}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label>Case Description</label>
                <input
                  type="text"
                  name="case_description"
                  value={formData.case_description}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label>Investigator Detail</label>
                <input
                  type="text"
                  name="investigator_detail"
                  value={formData.investigator_detail}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label>Referral Date</label>
                <input
                  type="date"
                  name="referral_date"
                  value={formData.referral_date}
                  onChange={handleFormChange}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            {/* ================= ACCUSED DETAILS ================= */}


{/* ================= ACCUSED DETAILS (BULK + CLEAN UI) ================= */}

<div className="mt-6 bg-white">

  {/* Header */}
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-md font-semibold text-gray-800">
      Accused Details
    </h3>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={addAccusedRow}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
      >
        + Add Row
      </button>

      <button
        type="button"
        onClick={() => {
          const remaining = formData.accused_details.filter(
            (_, i) => !selectedRows.includes(i)
          );
          setFormData({ ...formData, accused_details: remaining });
          setSelectedRows([]);
        }}
        disabled={selectedRows.length === 0}
        className={`px-4 py-2 rounded-lg text-white ${
          selectedRows.length === 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        Delete Selected
      </button>
    </div>
  </div>

  {/* Table */}
  <div className="overflow-auto max-h-[400px] border rounded-lg">

    {/* Header */}
    <div className="grid grid-cols-8 gap-3 bg-gray-100 text-gray-700 font-medium text-sm px-4 py-3 sticky top-0 z-10 border-b">

      {/* Select All */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={
            selectedRows.length === formData.accused_details.length &&
            formData.accused_details.length > 0
          }
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows(
                formData.accused_details.map((_, i) => i)
              );
            } else {
              setSelectedRows([]);
            }
          }}
        />
        All
      </div>

      <div>Name</div>
      <div>CID</div>
      <div className="col-span-2">Act Charges</div>
      <div>Prayer</div>
      <div>Counts</div>
      <div className="text-center">Action</div>
    </div>

    {/* Rows */}
    {formData.accused_details.map((acc, index) => (
      <div
        key={index}
        className={`grid grid-cols-8 gap-3 items-center px-4 py-3 border-b hover:bg-gray-50 ${
          selectedRows.includes(index) ? "bg-blue-50" : ""
        }`}
      >

        {/* Checkbox */}
        <div>
          <input
            type="checkbox"
            checked={selectedRows.includes(index)}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedRows([...selectedRows, index]);
              } else {
                setSelectedRows(
                  selectedRows.filter((i) => i !== index)
                );
              }
            }}
          />
        </div>

        {/* Name */}
        <input
          value={acc.name}
          placeholder="Name"
          onChange={(e) =>
            handleAccusedChange(index, "name", e.target.value)
          }
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
        />

        {/* CID */}
        <input
          value={acc.cid}
          placeholder="CID"
          onChange={(e) =>
            handleAccusedChange(index, "cid", e.target.value)
          }
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
        />

        {/* Act Charges (wide) */}
        <div className="col-span-2">
          <input
            value={acc.act_charges}
            placeholder="Act Charges"
            onChange={(e) =>
              handleAccusedChange(index, "act_charges", e.target.value)
            }
            className="w-full border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Prayer */}
        <input
          value={acc.prayer}
          placeholder="Prayer"
          onChange={(e) =>
            handleAccusedChange(index, "prayer", e.target.value)
          }
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
        />

        {/* Counts */}
        <input
          value={acc.counts}
          placeholder="Counts"
          onChange={(e) =>
            handleAccusedChange(index, "counts", e.target.value)
          }
          className="border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
        />

        {/* Remove (-) */}
        <div className="flex justify-center">
          <button
            type="button"
            disabled={formData.accused_details.length === 1}
            onClick={() => removeAccusedRow(index)}
            className="text-red-600 font-bold text-lg px-2 disabled:text-gray-400"
            title="Remove row"
          >
            −
          </button>
        </div>
      </div>
    ))}
  </div>
</div>
 {/* ================= ACCUSED DETAILS (ENTERPRISE LIVE UI) - END ================= */}

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={resetForm} className="px-4 py-2 border rounded">
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

        {/* TABLE */}
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium uppercase">
                  S/N
                </th>
                <th className="px-6 py-3">Case No</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Investigator</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
                {paginatedReferrals.map((r, i) => (
                  <>
                    {/* MAIN ROW */}
                    <tr key={r._id} className="hover:bg-gray-100">
                      <td className="px-6 py-3">{startIndex + i + 1}</td>
                      <td className="px-6 py-3">{r.case_no}</td>
                      <td className="px-6 py-3">{r.case_description}</td>
                      <td className="px-6 py-3">{r.investigator_detail}</td>
                      <td className="px-6 py-3">{r.status}</td>
                      <td className="px-6 py-3">
                        {r.referral_date?.split("T")[0]}
                      </td>
                      <td className="px-6 py-3 flex gap-4 items-center">
                        {/* EDIT */}
                        <button
                          onClick={() => handleEdit(r)}
                          className="text-gray-500 hover:text-gray-700 transition"
                          title="Edit"
                        >
                          <FaEdit size={16} />
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => handleDelete(r)}
                          className="text-gray-500 hover:text-gray-700 transition"
                          title="Delete"
                        >
                          <FaTrash size={16} />
                        </button>

                        {/* VIEW */}
                        <button
                          onClick={() =>
                            setExpandedRow(expandedRow === r._id ? null : r._id)
                          }
                          className="text-gray-500 hover:text-gray-700 transition"
                          title="View"
                        >
                          <FaEye size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* EXPANDED ROW */}
                    {expandedRow === r._id && (
                      <tr>
                       
                  <td colSpan="7" className="px-6 py-6 bg-gray-50">
                    <div className="space-y-6">

    {/* CASE DETAILS CARD */}
<div className="bg-white rounded-lg p-5 shadow-sm">
  <h3 className="text-md font-semibold text-gray-800 mb-4">
    Case Details
  </h3>

  <div className="grid md:grid-cols-4 gap-4 text-sm">

    {/* Row 1 */}
    <div>
      <p className="text-gray-500">Case No</p>
      <p className="font-medium text-gray-800">{r.case_no}</p>
    </div>

    <div>
      <p className="text-gray-500">Investigator</p>
      <p className="font-medium text-gray-800">{r.investigator_detail}</p>
    </div>

 {/* ================= for update status.  ================= */}

<div>
  <p className="text-gray-500">Status</p>

  <div className="flex items-center gap-3">

    {isEditingStatus !== r._id ? (
      <>
        <p className="font-medium text-gray-800">{r.status}</p>

        <button
          onClick={() => setEditingStatusId(r._id)} // ✅ FIXED
          className="text-blue-500 hover:text-blue-700 transition"
        >
          <FaEdit size={14} />
        </button>
      </>
    ) : (
      <select
        defaultValue={r.status}
        className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-700"
        onChange={(e) => {
          const newStatus = e.target.value;

          updateStatus(r._id, newStatus);

          setEditingStatusId(null); // ✅ FIXED
        }}
      >
        <option value="Pending">Pending</option>
        <option value="Under Review">Under Review</option>
        <option value="Under Prosecution">Under Prosecution</option>
        <option value="Trial">Trial</option>
      </select>
    )}

  </div>
</div>



    <div>
      <p className="text-gray-500">Date</p>
      <p className="font-medium text-gray-800">
        {r.referral_date?.split("T")[0]}
      </p>
    </div>

    {/* Row 2 - Full Width */}
    <div className="md:col-span-4">
      <p className="text-gray-500">Description</p>
      <p className="font-medium text-gray-800">
        {r.case_description}
      </p>
    </div>

  </div>
</div>

    {/* ACCUSED DETAILS CARD */}
    <div className="bg-white rounded-lg p-5 shadow-sm">
      <h3 className="text-md font-semibold text-gray-800 mb-4">
        Accused Details
      </h3>

      {r.accused_details && r.accused_details.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">CID</th>
                <th className="px-4 py-2 text-left">Act Charges</th>
                <th className="px-4 py-2 text-left">Prayer</th>
                <th className="px-4 py-2 text-left">Counts</th>
              </tr>
            </thead>
            <tbody>
              {r.accused_details.map((a, idx) => (
                <tr
                  key={idx}
                  className="border-t border-gray-400 hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-2">{a.name}</td>
                  <td className="px-4 py-2">{a.cid}</td>
                  <td className="px-4 py-2">{a.act_charges}</td>
                  <td className="px-4 py-2">{a.prayer}</td>
                  <td className="px-4 py-2">{a.counts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          No accused details available.
        </p>
      )}
    </div>

  </div>
</td>

                      </tr>
                    )}
                  </>
                ))}
              </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}