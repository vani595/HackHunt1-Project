import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CheckCircle, Clock, Compass, Globe, MapPin, Radar, Search, X } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiClient } from "../api/client";

// We will use "ongoing" in UI to match your preference
const STATUS_OPTIONS = ["all", "ongoing", "upcoming", "ended"];

const normalizeLocation = (value = "") => value.trim().toLowerCase();

// PRE-CACHED COORDINATES FOR INSTANT LOADING
const KNOWN_CITIES = {
  // Major Indian Cities
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "north delhi": { lat: 28.7309, lng: 77.2149 },
  "paschim vihar": { lat: 28.5355, lng: 77.0529 },
  
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "thane": { lat: 19.2183, lng: 72.9781 },
  "navi mumbai": { lat: 19.0330, lng: 73.0297 },
  "borivali": { lat: 19.2299, lng: 72.8197 },
  "borivali west": { lat: 19.2299, lng: 72.8197 },
  "vile parle": { lat: 19.1136, lng: 72.8697 },
  
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "ramanagara": { lat: 12.7150, lng: 77.2813 },
  
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "kattankalathur": { lat: 12.8236, lng: 80.0428 },
  
  "pune": { lat: 18.5204, lng: 73.8567 },
  "nashik": { lat: 19.9975, lng: 73.7898 },
  
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "batanagar": { lat: 22.3039, lng: 88.1084 },
  
  "jaipur": { lat: 26.9124, lng: 75.7873 },
  "rajasthan": { lat: 26.9124, lng: 75.7873 },
  
  "meerut": { lat: 28.9845, lng: 77.7064 },
  "gurgaon": { lat: 28.4595, lng: 77.0266 },
  "greater noida": { lat: 28.4744, lng: 77.5040 },
  "noida": { lat: 28.5658, lng: 77.3711 },
  "dharuhera": { lat: 28.2055, lng: 76.7953 },
  
  "dhanbad": { lat: 23.7957, lng: 86.4304 },
  
  "yelahanka": { lat: 13.1007, lng: 77.5963 },
  "pilani": { lat: 28.3802, lng: 75.6083 },
  "roorkee": { lat: 29.8543, lng: 77.8880 },
  "jammu": { lat: 32.7266, lng: 74.8570 },
  
  // US Cities (map to India center since they're outside India)
  "san francisco": { lat: 20.5937, lng: 78.9629 },
  "new york": { lat: 20.5937, lng: 78.9629 },
  "boston": { lat: 20.5937, lng: 78.9629 },
  "los angeles": { lat: 20.5937, lng: 78.9629 },
  "california": { lat: 20.5937, lng: 78.9629 },
  "massachusetts": { lat: 20.5937, lng: 78.9629 },
  
  // Default fallbacks
  "worldwide": { lat: 20.5937, lng: 78.9629 },
  "india": { lat: 20.5937, lng: 78.9629 },
  "online": { lat: 20.5937, lng: 78.9629 } // fallback for online events
};

const getCoordinates = (hackathon) => {
  if (!hackathon) return null;

  // Support both formats: { latitude, longitude } or { location: { lat, lng } }
  const lat = hackathon.location?.lat ?? hackathon.latitude;
  const lng = hackathon.location?.lng ?? hackathon.longitude;

  if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
    return { lat: Number(lat), lng: Number(lng) };
  }

  console.warn(`⚠️ Missing coordinates for: ${hackathon.title || "Unknown"}`, {
    location: hackathon.location,
    latitude: hackathon.latitude,
    longitude: hackathon.longitude
  });
  return null;
};

const hasValidCoordinates = (hackathon) => Boolean(getCoordinates(hackathon));

const HackathonTrackingMap = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  // Parse dates from various formats (ISO, "Posted Mar 26, 2026", etc.)
  const parseDate = (value) => {
    if (!value) return null;
    let candidate = typeof value === "string" ? value.trim() : value;
    
    // Remove "Posted" prefix if present
    candidate = candidate.replace(/^Posted\s+/i, "");
    
    const date = new Date(candidate);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getHackathonStatus = useCallback((hackathon) => {
    // Priority 1: Check status field
    const normalizedStatus = String(hackathon?.status || "").toLowerCase();
    if (["open", "active", "ongoing"].includes(normalizedStatus)) return "ongoing";
    if (["ended", "closed", "past"].includes(normalizedStatus)) return "ended";
    if (["upcoming", "scheduled", "planned"].includes(normalizedStatus)) return "upcoming";

    // Priority 2: Fall back to date comparison
    const start = parseDate(hackathon?.startDate);
    const end = parseDate(hackathon?.endDate);
    const now = new Date();

    if (start && end) {
      if (now >= start && now <= end) return "ongoing";
      if (now < start) return "upcoming";
      if (now > end) return "ended";
    }

    // If only startDate exists and status is "open", treat as ongoing
    if (start && !end) {
      if (normalizedStatus === "open") return "ongoing";
      return now < start ? "upcoming" : "ongoing";
    }

    if (!start && end) {
      return now > end ? "ended" : "ongoing";
    }

    // Default: if status is "open", it's ongoing; otherwise upcoming
    return normalizedStatus === "open" ? "ongoing" : "upcoming";
  }, []);

  // Extract meaningful city name from location string (with institutions)
  const extractCity = (locationStr) => {
    if (!locationStr) return "Unknown";
    const loc = locationStr.toLowerCase().trim();
    
    // Handle "Online" specifically
    if (loc === "online" || loc.includes("online")) return "Online";
    
    // Extract institution/university name if present
    const parts = locationStr.split(",").map(p => p.trim());
    
    // Look for institution keywords and extract the full name
    let institutionName = null;
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower.includes("institute") || 
          lower.includes("university") || 
          lower.includes("iit") ||
          lower.includes("nit") ||
          lower.includes("college")) {
        institutionName = part;
        break;
      }
    }

    // If we found an institution, extract just the key part (e.g., "IIT Mumbai" from "Indian Institute of Technology, Mumbai")
    if (institutionName) {
      // Clean up long names
      let cleanName = institutionName
        .replace(/indian institute of technology/gi, "IIT")
        .replace(/national institute of technology/gi, "NIT")
        .replace(/institute of technology/gi, "Institute")
        .replace(/([A-Z])[a-z]+ ?([A-Z])[a-z]+/g, "$1$2") // Abbreviate: "Indian School" -> "IS"
        .trim();
      
      // Extract city name from remaining parts
      const cityKeywords = ["delhi", "mumbai", "bangalore", "pune", "thane", "hyderabad", "chennai", "kolkata", "jaipur", "noida", "gurgaon"];
      const cityPart = parts.find(p => cityKeywords.some(city => p.toLowerCase().includes(city)));
      
      if (cityPart) {
        return `${cleanName}, ${cityPart}`;
      }
      return cleanName;
    }

    // Fallback: extract city name
    const cityPatterns = {
      "delhi": "Delhi",
      "new delhi": "New Delhi",
      "mumbai": "Mumbai",
      "thane": "Thane",
      "bangalore": "Bangalore",
      "bengaluru": "Bangalore",
      "pune": "Pune",
      "hyderabad": "Hyderabad",
      "chennai": "Chennai",
      "kolkata": "Kolkata",
      "jaipur": "Jaipur",
      "noida": "Noida",
      "greater noida": "Greater Noida",
      "gurgaon": "Gurgaon",
      "meerut": "Meerut",
      "dhanbad": "Dhanbad",
      "nashik": "Nashik",
      "ramanagara": "Ramanagara",
      "navi mumbai": "Navi Mumbai",
      "borivali": "Borivali",
      "yelahanka": "Yelahanka",
      "pilani": "Pilani"
    };

    for (const [pattern, cityName] of Object.entries(cityPatterns)) {
      if (loc.includes(pattern)) {
        return cityName;
      }
    }

    // Return first meaningful part
    const meaningful = parts.filter(p => p.length > 1 && !p.toLowerCase().includes("india"));
    return meaningful.length > 0 ? meaningful[0] : "Unknown";
  };

  // AUTO-GEOCODER
  const autoGeocodeLocations = async (items) => {
    const updatedItems = [];
    
    for (const item of items) {
      if (hasValidCoordinates(item)) {
        updatedItems.push(item);
        continue;
      }

      const locStr = (item.location || "").toLowerCase();
      
      // For online/tba events, assign default India center coordinates so they appear on map
      if (locStr === "online" || locStr === "tba" || !locStr) {
        updatedItems.push({
          ...item,
          latitude: KNOWN_CITIES["online"].lat,
          longitude: KNOWN_CITIES["online"].lng,
          isOnlineEvent: true
        });
        continue;
      }

      // Check predefined fast dictionary first
      let matched = false;
      for (const [city, coords] of Object.entries(KNOWN_CITIES)) {
        if (locStr.includes(city)) {
          updatedItems.push({
            ...item,
            latitude: coords.lat,
            longitude: coords.lng
          });
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Fallback to cache/api if not in dictionary
        const cacheKey = `hackhunt_geo_${normalizeLocation(item.location)}`;
        const cachedCoordsStr = localStorage.getItem(cacheKey);
        
        if (cachedCoordsStr) {
          try {
            const coords = JSON.parse(cachedCoordsStr);
            if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
              updatedItems.push({ ...item, latitude: coords.lat, longitude: coords.lng });
            } else {
              // Cache has invalid data, treat as unmapped
              updatedItems.push({
                ...item,
                latitude: KNOWN_CITIES["india"].lat,
                longitude: KNOWN_CITIES["india"].lng,
                isUnmappedLocation: true
              });
            }
          } catch (e) {
            // Cache parse error, treat as unmapped
            updatedItems.push({
              ...item,
              latitude: KNOWN_CITIES["india"].lat,
              longitude: KNOWN_CITIES["india"].lng,
              isUnmappedLocation: true
            });
          }
        } else {
          // Fallback: assign to India center for unmapped locations
          updatedItems.push({
            ...item,
            latitude: KNOWN_CITIES["india"].lat,
            longitude: KNOWN_CITIES["india"].lng,
            isUnmappedLocation: true
          });
        }
      }
    }
    return updatedItems;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      console.log("📊 Loading hackathon data...");
      try {
        // Import local unstop data
        const { default: unstopData } = await import("../data/unstop_scraped_data.json");
        const normalizedData = (unstopData || []).map((h) => ({
          ...h,
          id: h.id || Math.random().toString(),
          _id: h.id,
        }));
        
        console.log(`✅ Loaded ${normalizedData.length} hackathons from unstop_scraped_data.json`);
        const enrichedHackathons = await autoGeocodeLocations(normalizedData);
        console.log(`✅ Enriched ${enrichedHackathons.length} hackathons with coordinates`);
        setHackathons(enrichedHackathons);
      } catch (error) {
        console.error("❌ Error loading hackathons:", error);
        setHackathons([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Instant Filter Engine
  useEffect(() => {
    const locationTerm = normalizeLocation(searchLocation);
    const filtered = hackathons.filter((hackathon) => {
      const locationHaystack = normalizeLocation(hackathon.location || "");
      const status = getHackathonStatus(hackathon);
      
      const matchesLocation = !locationTerm || locationHaystack.includes(locationTerm);
      const matchesStatus = selectedStatus === "all" || status === selectedStatus;
      
      return matchesLocation && matchesStatus;
    });

    // Debug logs
    console.log("🔍 HackathonTrackingMap Filter Debug:");
    console.log(`  Total loaded hackathons: ${hackathons.length}`);
    console.log(`  Selected filter: "${selectedStatus}"`);
    console.log(`  Search location: "${searchLocation}"`);
    console.log(`  Filtered results: ${filtered.length}`);
    console.log(`  Valid coordinates: ${filtered.filter(hasValidCoordinates).length}`);
    
    // Show status breakdown
    const statusBreakdown = {
      upcoming: filtered.filter(h => getHackathonStatus(h) === "upcoming").length,
      ongoing: filtered.filter(h => getHackathonStatus(h) === "ongoing").length,
      ended: filtered.filter(h => getHackathonStatus(h) === "ended").length
    };
    console.log(`  Status breakdown: ${statusBreakdown.upcoming} upcoming, ${statusBreakdown.ongoing} ongoing, ${statusBreakdown.ended} ended`);
    
    console.table(
      filtered.map((h) => ({
        title: h.title.slice(0, 30),
        status: getHackathonStatus(h),
        location: h.location.slice(0, 25),
        hasCoords: hasValidCoordinates(h),
        lat: getCoordinates(h)?.lat.toFixed(4) || "N/A",
        lng: getCoordinates(h)?.lng.toFixed(4) || "N/A",
        startDate: h.startDate?.toString().slice(0, 10) || "N/A"
      }))
    );

    setFilteredHackathons(filtered);
  }, [hackathons, searchLocation, selectedStatus, getHackathonStatus]);

  // Live Stats Calculator based on current filters
  const stats = useMemo(() => {
    const total = filteredHackathons.length;
    const ongoing = filteredHackathons.filter(h => getHackathonStatus(h) === "ongoing").length;
    const upcoming = filteredHackathons.filter(h => getHackathonStatus(h) === "upcoming").length;
    const ended = filteredHackathons.filter(h => getHackathonStatus(h) === "ended").length;
    const online = filteredHackathons.filter(h => (h.location || "").toLowerCase().includes("online")).length;
    const onMap = filteredHackathons.filter(hasValidCoordinates).length;

    console.log(`📊 Stats: ${total} total, ${ongoing} ongoing, ${upcoming} upcoming, ${ended} ended, ${online} online, ${onMap} on map`);

    return {
      total,
      ongoing,
      upcoming,
      ended,
      online,
      onMap
    };
  }, [filteredHackathons, getHackathonStatus]);

  // Group by location for Map Pins
  const locationGroups = useMemo(() => {
    const groups = new Map();
    console.log("📍 Grouping hackathons by coordinates...");
    
    filteredHackathons
      .filter(hasValidCoordinates)
      .filter(h => !(h.location || "").toLowerCase().includes("online")) // Exclude online events from map
      .forEach((hackathon, idx) => {
        const coords = getCoordinates(hackathon);
        if (!coords) return;

        // Use 6 decimal places for key (~0.1m precision) to keep events at same location separate
        // But still group events that are EXACTLY the same location
        const key = `${coords.lat.toFixed(6)}:${coords.lng.toFixed(6)}`;
        
        console.log(`  [${idx}] ${hackathon.title.slice(0, 40)} → lat:${coords.lat.toFixed(4)}, lng:${coords.lng.toFixed(4)}, key:${key}`);

        if (!groups.has(key)) {
          const displayName = extractCity(hackathon.location);

          groups.set(key, {
            key,
            location: displayName,
            items: [],
            latitude: coords.lat,
            longitude: coords.lng,
            statusCounts: { ongoing: 0, upcoming: 0, ended: 0 }
          });
        }

        const group = groups.get(key);
        const status = getHackathonStatus(hackathon);
        group.items.push(hackathon);
        group.statusCounts[status] = (group.statusCounts[status] || 0) + 1;
      });

    const results = Array.from(groups.values());
    console.log(`✅ Created ${results.length} unique location groups from ${filteredHackathons.length} filtered events`);
    results.forEach((group, i) => {
      console.log(`  Group ${i + 1}: ${group.location.slice(0, 40)} - ${group.items.length} events (${group.statusCounts.ongoing}ongoing, ${group.statusCounts.upcoming}upcoming, ${group.statusCounts.ended}ended)`);
    });
    
    return results;
  }, [filteredHackathons, getHackathonStatus]);

  // Render Leaflet Map
  useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }
    markersRef.current = [];
    if (!mapRef.current) return undefined;

    console.log("🗺️ Map Rendering:");
    console.log(`  Location groups to render: ${locationGroups.length}`);
    console.log(`  Total markers: ${locationGroups.reduce((sum, g) => sum + g.items.length, 0)}`);

    // Create map with enhanced styling
    mapInstance.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false
    }).setView([22.5937, 78.9629], 5);
    
    // Premium tile layer with modern aesthetic
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      minZoom: 3,
      className: 'map-tiles'
    }).addTo(mapInstance.current);

    // Add subtle gradient overlay for India focus
    const indiaGradientOverlay = L.rectangle([
      [8.0, 68.0],
      [35.0, 97.0]
    ], {
      color: '#8b5cf6',
      weight: 2,
      opacity: 0.15,
      fill: true,
      fillColor: '#8b5cf6',
      fillOpacity: 0.02,
      dashArray: '5, 5',
      className: 'india-boundary-overlay'
    }).addTo(mapInstance.current);

    // Customize zoom control
    const zoomControl = mapInstance.current.zoomControl;
    zoomControl.setPosition('bottomright');

    if (!locationGroups.length) {
      console.warn("⚠️ No location groups to render on map");
      return undefined;
    }

    const bounds = [];
    
    locationGroups.forEach((group) => {
      // Determine primary status for styling
      const hasOngoing = group.statusCounts.ongoing > 0;
      const hasUpcoming = group.statusCounts.upcoming > 0;
      const hasEnded = group.statusCounts.ended > 0;

      // Status-based color scheme
      let pinColor, pinGradient, badgeColor, badgeText;
      if (hasOngoing) {
        pinColor = "#10b981";
        pinGradient = "from-emerald-400 to-emerald-600";
        badgeColor = "#d1fae5";
        badgeText = "#047857";
      } else if (hasUpcoming) {
        pinColor = "#3b82f6";
        pinGradient = "from-blue-400 to-blue-600";
        badgeColor = "#dbeafe";
        badgeText = "#1e40af";
      } else {
        pinColor = "#64748b";
        pinGradient = "from-slate-400 to-slate-600";
        badgeColor = "#f1f5f9";
        badgeText = "#334155";
      }

      const customIcon = L.divIcon({
        className: 'custom-pin bg-transparent border-0',
        html: `
          <svg width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));">
            <!-- Gradient and filters -->
            <defs>
              <linearGradient id="pinGradient-${group.items.length}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:${pinColor};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${pinColor};stop-opacity:0.85" />
              </linearGradient>
              <filter id="shadowFilter">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
              </filter>
            </defs>
            
            <!-- Main pin shape (Google Maps style teardrop) -->
            <path d="M20 0C8.954 0 0 8.954 0 20c0 15 20 36 20 36s20-21 20-36c0-11.046-8.954-20-20-20z" 
                  fill="url(#pinGradient-${group.items.length})" 
                  stroke="white" 
                  stroke-width="2"
                  filter="url(#shadowFilter)"/>
            
            <!-- Inner circle badge -->
            <circle cx="20" cy="18" r="8" fill="white" opacity="0.95"/>
            <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="${pinColor}" font-family="system-ui, -apple-system, sans-serif">
              ${group.items.length}
            </text>
          </svg>
        `,
        iconSize: [40, 56],
        iconAnchor: [20, 56],
        popupAnchor: [0, -56],
        className: 'marker-google-style'
      });
      
      const marker = L.marker([group.latitude, group.longitude], { icon: customIcon })
                      .addTo(mapInstance.current);

      // Enhanced popup with status badges
      const titlesHtml = group.items
        .slice(0, 5)
        .map(h => {
          const hStatus = getHackathonStatus(h);
          let statusBadge = '';
          if (hStatus === 'ongoing') {
            statusBadge = '<span class="inline-block px-2 py-0.5 ml-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-full">Live</span>';
          } else if (hStatus === 'upcoming') {
            statusBadge = '<span class="inline-block px-2 py-0.5 ml-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">Soon</span>';
          }
          return `<li class="py-2.5 px-3 border-b border-slate-100 last:border-0 font-medium text-slate-800 hover:bg-violet-50 transition rounded flex items-start justify-between gap-2">
            <span class="truncate flex-1">• ${h.title}</span>
            ${statusBadge}
          </li>`;
        })
        .join('');
      
      const moreHtml = group.items.length > 5 
        ? `<li class="py-2 px-3 text-violet-600 font-bold text-xs">→ ${group.items.length - 5} more events</li>` 
        : '';

      const statusBadges = `
        <div class="flex flex-wrap gap-1.5 mb-3">
          ${group.statusCounts.ongoing > 0 ? `<span class="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700"><span class="w-2 h-2 rounded-full bg-emerald-500"></span>${group.statusCounts.ongoing} Ongoing</span>` : ''}
          ${group.statusCounts.upcoming > 0 ? `<span class="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-bold text-blue-700"><span class="w-2 h-2 rounded-full bg-blue-500"></span>${group.statusCounts.upcoming} Upcoming</span>` : ''}
          ${group.statusCounts.ended > 0 ? `<span class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-full text-xs font-bold text-slate-600"><span class="w-2 h-2 rounded-full bg-slate-400"></span>${group.statusCounts.ended} Ended</span>` : ''}
        </div>
      `;
      
      marker.bindPopup(
        `<div class="font-sans min-w-[260px] max-w-[320px]" style="font-family: system-ui, -apple-system, sans-serif;">
          <div class="bg-gradient-to-r ${pinGradient} text-white px-4 py-3 font-bold text-sm flex items-center gap-2 rounded-t-xl">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${group.location}
          </div>
          <div class="p-3 bg-white">
            ${statusBadges}
            <ul class="text-sm m-0 p-0 list-none border-t border-slate-100 pt-2">
              ${titlesHtml}
              ${moreHtml}
            </ul>
          </div>
        </div>`,
        { className: 'leaflet-popup-enhanced rounded-xl shadow-2xl border-0 overflow-hidden' }
      );

      bounds.push([group.latitude, group.longitude]);
      markersRef.current.push(marker);
    });

    if (bounds.length === 1) {
      // Single location: zoom to that area with nice padding
      mapInstance.current.setView(bounds[0], 11);
    } else if (bounds.length > 1) {
      // Multiple locations: fit all bounds with enhanced padding
      const boundsObject = L.latLngBounds(bounds);
      mapInstance.current.fitBounds(boundsObject, { 
        padding: [80, 80], 
        maxZoom: 11,
        animate: true,
        duration: 1.2
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markersRef.current = [];
    };
  }, [locationGroups]);

  if (loading) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="flex h-[500px] w-full flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/70 dark:to-slate-700/70">
          <div className="mb-6 inline-flex items-center justify-center">
            <div className="absolute h-16 w-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-80"></div>
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-200">Loading Hackathon Data...</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Gathering information from across India</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-[34px] border border-white/70 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.18),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.92),rgba(248,250,252,0.82))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.16),transparent_24%),linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.9))] dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-violet-700 shadow-sm dark:from-violet-500/20 dark:to-purple-500/20 dark:text-violet-300">
            <div className="relative flex h-2 w-2">
              <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75"></div>
              <div className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></div>
            </div>
            Live tracking
          </div>
          <h3 className="mt-5 text-4xl font-bold tracking-[-0.02em] text-slate-950 dark:text-slate-50">Hackathon Radar</h3>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Discover and track hackathon events across India in real-time. Filter by status, search by location, and stay updated.
          </p>
        </div>

        <div className="relative w-full lg:w-[28rem] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5 group-focus-within:text-violet-500 transition" />
          <input
            type="text"
            placeholder="Search city (e.g., Delhi, Mumbai, Pune)..."
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white/85 py-3.5 pl-12 pr-10 text-sm font-medium text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-all duration-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/20 focus:shadow-lg focus:shadow-violet-500/10 dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-violet-400 dark:focus:ring-violet-500/30"
          />
          {searchLocation && (
            <button
              onClick={() => setSearchLocation("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition duration-200 p-1 hover:bg-slate-100 rounded-lg dark:hover:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="group flex items-center gap-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-violet-200 dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700 dark:hover:border-violet-500/30">
          <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 p-3 shadow-sm group-hover:scale-110 transition"><MapPin className="text-violet-600" size={20} /></div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Events</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50">{stats.total}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-[24px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-emerald-400 dark:border-emerald-500/30 dark:bg-gradient-to-br dark:from-emerald-500/15 dark:to-emerald-500/10 dark:hover:border-emerald-500/50">
          <div className="rounded-2xl bg-white p-3 shadow-sm group-hover:scale-110 transition"><CheckCircle className="text-emerald-500" size={20} /></div>
          <div>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Ongoing</p>
            <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100">{stats.ongoing}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-400 dark:border-blue-500/30 dark:bg-gradient-to-br dark:from-blue-500/15 dark:to-blue-500/10 dark:hover:border-blue-500/50">
          <div className="rounded-2xl bg-white p-3 shadow-sm group-hover:scale-110 transition"><Calendar className="text-blue-500" size={20} /></div>
          <div>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">Upcoming</p>
            <p className="text-2xl font-black text-blue-900 dark:text-blue-100">{stats.upcoming}</p>
          </div>
        </div>
        <div className="group flex items-center gap-4 rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 p-4 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-slate-400 dark:border-white/10 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-700 dark:hover:border-slate-600">
          <div className="rounded-2xl bg-white p-3 shadow-sm group-hover:scale-110 transition"><Clock className="text-slate-500" size={20} /></div>
          <div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ended</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{stats.ended}</p>
          </div>
        </div>
        <div className="group col-span-2 flex items-center gap-4 rounded-[24px] border border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4 shadow-sm transition duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-violet-400 dark:border-violet-500/30 dark:bg-gradient-to-br dark:from-violet-500/15 dark:to-violet-500/10 dark:hover:border-violet-500/50 xl:col-span-1">
          <div className="rounded-2xl bg-white p-3 shadow-sm group-hover:scale-110 transition"><Compass className="text-violet-500" size={20} /></div>
          <div>
            <p className="text-xs font-bold uppercase text-violet-700 dark:text-violet-300 tracking-wider">Online</p>
            <p className="text-2xl font-black text-violet-900 dark:text-violet-100">{stats.online}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-gradient-to-r from-white/80 to-slate-50/80 p-5 shadow-sm dark:border-white/10 dark:bg-gradient-to-r dark:from-slate-900/70 dark:to-slate-800/50 dark:shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span className="mr-2 text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Filter by Status:</span>
            {STATUS_OPTIONS.map((status) => {
              let Icon, colorClass;
              switch(status) {
                case 'ongoing':
                  Icon = CheckCircle;
                  colorClass = "from-emerald-500 to-emerald-600";
                  break;
                case 'upcoming':
                  Icon = Calendar;
                  colorClass = "from-blue-500 to-blue-600";
                  break;
                case 'ended':
                  Icon = Clock;
                  colorClass = "from-slate-500 to-slate-600";
                  break;
                default:
                  Icon = Compass;
                  colorClass = "from-violet-500 to-violet-600";
              }
              
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-all duration-300 ${
                    selectedStatus === status
                      ? `bg-gradient-to-r ${colorClass} text-white shadow-lg shadow-violet-500/25 scale-105`
                      : "border border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:shadow-md dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-violet-500/30 dark:hover:text-violet-300 dark:hover:shadow-lg dark:hover:shadow-violet-500/10"
                  }`}
                >
                  <Icon size={16} />
                  {status}
                </button>
              );
            })}
          </div>

          {stats.online > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 px-4 py-2.5 text-xs font-bold text-violet-700 shadow-sm dark:border-violet-500/30 dark:bg-gradient-to-r dark:from-violet-500/10 dark:to-blue-500/10 dark:text-violet-300">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></div>
              {stats.online} Online Events
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900/70 dark:shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
        <style>{`
          .leaflet-container {
            background: linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 50%, #fce7f3 100%) !important;
            font-family: system-ui, -apple-system, sans-serif;
          }
          
          /* Google Maps style marker */
          .marker-google-style {
            cursor: pointer;
            transition: transform 0.2s ease, filter 0.2s ease;
          }
          
          .marker-google-style:hover svg {
            transform: scale(1.15);
            filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
          }
          
          /* Enhanced zoom controls */
          .leaflet-control-zoom {
            border: 2px solid rgba(139, 92, 246, 0.25) !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 32px rgba(139, 92, 246, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1) !important;
            background-color: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px);
          }
          
          .leaflet-control-zoom a {
            color: #6366f1 !important;
            font-weight: 700;
            font-size: 16px !important;
            background-color: transparent !important;
            border: none !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            width: 36px !important;
            height: 36px !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .leaflet-control-zoom a:hover {
            background-color: rgba(99, 102, 241, 0.15) !important;
            color: #4f46e5 !important;
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3) inset;
          }
          
          .leaflet-control-zoom a:active {
            background-color: rgba(99, 102, 241, 0.25) !important;
            transform: scale(0.95);
          }
          
          /* Attribution styling */
          .leaflet-control-attribution {
            background-color: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(10px);
            border-radius: 8px !important;
            font-size: 11px !important;
            padding: 6px 10px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .leaflet-control-attribution a {
            color: #6366f1 !important;
            text-decoration: none;
            transition: color 0.2s ease;
          }
          
          .leaflet-control-attribution a:hover {
            color: #4f46e5 !important;
            text-decoration: underline;
          }
          
          /* India boundary overlay */
          .india-boundary-overlay {
            pointer-events: none;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
          
          /* Popup styling */
          .leaflet-popup-content-wrapper {
            border-radius: 12px !important;
            box-shadow: 0 16px 48px rgba(139, 92, 246, 0.2), 0 8px 24px rgba(0, 0, 0, 0.15) !important;
            border: 1px solid rgba(139, 92, 246, 0.1) !important;
            background-color: white !important;
          }
          
          .leaflet-popup-tip {
            background-color: white !important;
            border: 1px solid rgba(139, 92, 246, 0.1);
          }
          
          .leaflet-popup-content {
            margin: 0 !important;
          }
          
          /* Tile layer enhancement */
          .map-tiles {
            filter: brightness(1.05) contrast(1.02);
          }
        `}</style>
        
        {locationGroups.length > 0 ? (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 shadow-inner dark:border-white/10">
            <div
              ref={mapRef}
              className="z-0 h-[550px] w-full"
            />
          </div>
        ) : (
          <div className="flex h-[550px] w-full flex-col items-center justify-center rounded-[24px] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/70 dark:to-slate-700/70">
            <div className="mb-4 rounded-full bg-slate-200 p-4 dark:bg-slate-600">
              <MapPin className="h-12 w-12 text-slate-400 dark:text-slate-300" />
            </div>
            <p className="text-lg font-bold text-slate-600 dark:text-slate-200">No hackathons found</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or changing the status filter to see events on the map.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HackathonTrackingMap;
