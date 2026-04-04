import React, { useEffect, useState, useRef } from "react";
import { MapPin, Navigation } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const LocationMapInput = ({ onLocationChange }) => {
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(51.505);
  const [longitude, setLongitude] = useState(-0.09);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      mapInstance.current = L.map(mapRef.current).setView([latitude, longitude], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstance.current);

      // Add click listener to map
      mapInstance.current.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        updateMarker(lat, lng);
        await getAddressFromCoords(lat, lng);
      });

      // Initial marker
      markerRef.current = L.marker([latitude, longitude])
        .addTo(mapInstance.current)
        .bindPopup("Your location");
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const updateMarker = (lat, lng) => {
    setLatitude(lat);
    setLongitude(lng);
    if (mapInstance.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstance.current.setView([lat, lng], 13);
    }
    onLocationChange({ latitude: lat, longitude: lng, address });
  };

  const getAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const foundAddress = data.address?.city || data.address?.town || data.display_name || "Unknown";
      setAddress(foundAddress);
      setLocation(foundAddress);
      onLocationChange({ latitude: lat, longitude: lng, address: foundAddress });
    } catch (err) {
      console.error("Error fetching address:", err);
    }
  };

  const autoTrackLocation = () => {
    setLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        updateMarker(lat, lng);
        getAddressFromCoords(lat, lng);
        setLoading(false);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError(`Failed to get location: ${err.message}`);
        setLoading(false);
      }
    );
  };

  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    onLocationChange({ latitude, longitude, address: value });
  };

  const handleAddressInputChange = (e) => {
    const value = e.target.value;
    setAddress(value);
    onLocationChange({ latitude, longitude, address: value });
  };

  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-950">Event Location</h3>
        <button
          onClick={autoTrackLocation}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
        >
          <Navigation size={16} />
          {loading ? "Tracking..." : "Auto Track Location"}
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="h-96 w-full rounded-2xl border border-slate-200"
        style={{ background: "#f0f0f0" }}
      />

      {/* Location Inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-slate-700">Location Name</label>
          <input
            type="text"
            value={location}
            onChange={handleLocationInputChange}
            placeholder="e.g., San Francisco, USA"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700">Exact Address</label>
          <input
            type="text"
            value={address}
            onChange={handleAddressInputChange}
            placeholder="e.g., 123 Business St, Suite 100"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Coordinates Display */}
      <div className="grid gap-4 md:grid-cols-2 rounded-2xl bg-slate-50 p-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Latitude</p>
          <p className="mt-1 font-mono font-semibold text-slate-900">{latitude.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Longitude</p>
          <p className="mt-1 font-mono font-semibold text-slate-900">{longitude.toFixed(6)}</p>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        📍 <strong>Tip:</strong> Click on the map to select a location, or use "Auto Track Location" to use your current position.
      </p>
    </div>
  );
};

export default LocationMapInput;
