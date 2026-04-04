import React, { useState } from "react";
import { hackathons as initialHackathons } from "../data/hackathons";

const emptyHackathon = {
  id: "",
  title: "",
  description: "",
  totalPrize: "",
  startDate: "",
  endDate: "",
  registrationUrl: "",
  imageUrl: "",
  organizer: "",
  location: "",
  type: "online",
  status: "upcoming",
  tags: [],
};

const Organiser = () => {
  const [hackathons, setHackathons] = useState(initialHackathons);
  const [formData, setFormData] = useState(emptyHackathon);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "tags") {
      setFormData({
        ...formData,
        tags: value.split(",").map((t) => t.trim()),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title || !formData.startDate) {
      alert("Title & Start Date required");
      return;
    }

    setHackathons([
      ...hackathons,
      {
        ...formData,
        id: Date.now().toString(),
      },
    ]);

    setFormData(emptyHackathon);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Organiser Dashboard</h1>

      {/* Add Hackathon Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow p-6 mb-10 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          name="title"
          placeholder="Title"
          className="input"
          value={formData.title}
          onChange={handleChange}
        />
        <input
          name="organizer"
          placeholder="Organizer"
          className="input"
          value={formData.organizer}
          onChange={handleChange}
        />
        <input
          name="totalPrize"
          placeholder="Total Prize"
          className="input"
          value={formData.totalPrize}
          onChange={handleChange}
        />
        <input
          name="location"
          placeholder="Location"
          className="input"
          value={formData.location}
          onChange={handleChange}
        />

        <input
          name="startDate"
          type="date"
          className="input"
          value={formData.startDate}
          onChange={handleChange}
        />
        <input
          name="endDate"
          type="date"
          className="input"
          value={formData.endDate}
          onChange={handleChange}
        />

        <input
          name="registrationUrl"
          placeholder="Registration URL"
          className="input"
          value={formData.registrationUrl}
          onChange={handleChange}
        />
        <input
          name="imageUrl"
          placeholder="Image URL"
          className="input"
          value={formData.imageUrl}
          onChange={handleChange}
        />

        <select
          name="type"
          className="input"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="online">Online</option>
          <option value="hybrid">Hybrid</option>
          <option value="in-person">In-Person</option>
        </select>

        <select
          name="status"
          className="input"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="active">Active</option>
          <option value="open">Open</option>
          <option value="ended">Ended</option>
        </select>

        <textarea
          name="description"
          placeholder="Description"
          className="input md:col-span-2"
          value={formData.description}
          onChange={handleChange}
        />

        <input
          name="tags"
          placeholder="Tags (comma separated)"
          className="input md:col-span-2"
          onChange={handleChange}
        />

        <button
          type="submit"
          className="md:col-span-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
        >
          Add Hackathon
        </button>
      </form>

      {/* Hackathon List */}
      <h2 className="text-xl font-semibold mb-4">All Hackathons</h2>

      <div className="grid gap-4">
        {hackathons.map((h) => (
          <div
            key={h.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between"
          >
            <div>
              <h3 className="font-bold">{h.title}</h3>
              <p className="text-sm text-gray-600">{h.organizer}</p>
            </div>
            <span className="text-sm px-3 py-1 rounded-full bg-gray-100">
              {h.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Organiser;
