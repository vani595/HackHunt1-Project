import React, { useState } from "react";

const Admin = () => {
  const [hackathons, setHackathons] = useState([
    {
      id: 1,
      title: "AI Hackathon",
      organiser: "Google",
      status: "Pending",
      participants: 120,
    },
    {
      id: 2,
      title: "Web3 Hackathon",
      organiser: "Ethereum",
      status: "Approved",
      participants: 85,
    },
    {
      id: 3,
      title: "Open Source Sprint",
      organiser: "GitHub",
      status: "Rejected",
      participants: 40,
    },
  ]);

  const updateStatus = (id, newStatus) => {
    setHackathons((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, status: newStatus } : h
      )
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <h1 className="text-3xl font-bold mb-6">🛠️ Admin Dashboard</h1>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="font-semibold mb-4">📋 Hackathon Approvals</h2>

        {hackathons.length === 0 && (
          <p className="text-gray-500">No hackathons available.</p>
        )}

        <div className="space-y-4">
          {hackathons.map((h) => (
            <div
              key={h.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold">{h.title}</h3>
                <p className="text-sm text-gray-500">
                  Organiser: {h.organiser}
                </p>
                <p className="text-sm text-gray-500">
                  Participants: {h.participants}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* STATUS */}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    h.status === "Pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : h.status === "Approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {h.status}
                </span>

                {/* ACTIONS */}
                {h.status === "Pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(h.id, "Approved")}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(h.id, "Rejected")}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Admin;
