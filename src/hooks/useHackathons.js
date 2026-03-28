import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useRealtimeStream } from "./useRealtimeStream";
import unstopHackathons from "../data/unstop_scraped_data.json";

export function useHackathons({ searchTerm = "", status = "", type = "" }) {
  const [hackathons, setHackathons] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useRealtimeStream({
    "hackathon:created": () => setReloadKey((value) => value + 1),
    "hackathon:updated": () => setReloadKey((value) => value + 1),
    "hackathon:deleted": () => setReloadKey((value) => value + 1),
    "hackathon:approval-updated": () => setReloadKey((value) => value + 1),
    "registration:created": () => setReloadKey((value) => value + 1),
    "registration:deleted": () => setReloadKey((value) => value + 1)
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getHackathons({
          search: searchTerm,
          status,
          type
        });

        if (!active) return;
        setHackathons(response.hackathons || []);
        setTotal(response.total || 0);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load hackathons.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [reloadKey, searchTerm, status, type]);

  return { hackathons, total, loading, error };
}

export function useHackathon(id) {
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check local unstop dataset for our ID (good for UI elements that use unstop IDs)
        let response = null;
        const localFallback = unstopHackathons.find(
          (h) => h.id === id || h._id === id || h.id === String(id)
        );

        if (localFallback) {
          response = {
            id: localFallback.id || localFallback._id,
            title: localFallback.title || "Untitled Hackathon",
            description: localFallback.description || "No description available.",
            totalPrize: localFallback.totalPrize || "",
            startDate: localFallback.startDate || "",
            endDate: localFallback.endDate || "",
            imageUrl: localFallback.imageUrl || "",
            registrationUrl: localFallback.registrationUrl || "",
            organizer: localFallback.organizer || localFallback.organizerName || "",
            location: localFallback.location || "",
            type: localFallback.type || "in-person",
            tags: localFallback.tags || [],
            status: localFallback.status || "upcoming"
          };
        } else {
          try {
            response = await apiClient.getHackathon(id);
          } catch (err) {
            // API lookup failed, try local fallback in case the ID belongs to unstop dataset
            const fallback = unstopHackathons.find(
              (h) => h.id === id || h._id === id || h.id === String(id)
            );
            if (fallback) {
              response = {
                id: fallback.id || fallback._id,
                title: fallback.title || "Untitled Hackathon",
                description: fallback.description || "No description available.",
                totalPrize: fallback.totalPrize || "",
                startDate: fallback.startDate || "",
                endDate: fallback.endDate || "",
                imageUrl: fallback.imageUrl || "",
                registrationUrl: fallback.registrationUrl || "",
                organizer: fallback.organizer || fallback.organizerName || "",
                location: fallback.location || "",
                type: fallback.type || "in-person",
                tags: fallback.tags || [],
                status: fallback.status || "upcoming"
              };
            }

            if (!response) {
              throw err;
            }
          }
        }

        if (!active) return;

        if (!response) {
          setHackathon(null);
          setError("Hackathon not found.");
          return;
        }

        setHackathon(response);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load hackathon.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (id) {
      load();
    }

    return () => {
      active = false;
    };
  }, [id]);

  return { hackathon, loading, error };
}

export function useHackathonStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useRealtimeStream({
    "hackathon:created": () => setReloadKey((value) => value + 1),
    "hackathon:updated": () => setReloadKey((value) => value + 1),
    "hackathon:deleted": () => setReloadKey((value) => value + 1),
    "hackathon:approval-updated": () => setReloadKey((value) => value + 1)
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getHackathonStats();
        if (!active) return;
        setStats(response);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load stats.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return { stats, loading, error };
}
