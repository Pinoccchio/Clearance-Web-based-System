"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// CJC Main Campus coordinates (Sacred Heart Avenue, Digos City)
const CJC_MAIN_LAT = 6.7513;
const CJC_MAIN_LNG = 125.3522;

// CJC Power Campus coordinates
const CJC_POWER_LAT = 6.769284;
const CJC_POWER_LNG = 125.344434;

// Center between both campuses
const CENTER_LAT = (CJC_MAIN_LAT + CJC_POWER_LAT) / 2;
const CENTER_LNG = (CJC_MAIN_LNG + CJC_POWER_LNG) / 2;
const DEFAULT_ZOOM = 14;

// Free tile layer providers (no API key needed)
const TILE_LAYERS = {
  map: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attr: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  humanitarian: {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/">Humanitarian OSM Team</a>',
    maxZoom: 19,
  },
} as const;

// Satellite label overlay (free, rendered on top of satellite tiles)
const SAT_LABELS = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  attr: "Labels &copy; Esri",
  maxZoom: 18,
};

// Google Street View embeds (no API key needed for embeds)
const STREET_VIEW_MAIN =
  "https://www.google.com/maps/embed?pb=!4v1770544849870!6m8!1m7!1s7K5_Hij-aeCuMCWjed1bEg!2m2!1d6.751921732698407!2d125.3521803818293!3f186.74515020771304!4f-17.028356242093196!5f1.385255237394996";
const STREET_VIEW_POWER =
  "https://www.google.com/maps/embed?pb=!4v1772890359389!6m8!1m7!1sFCTEPDYMDoFoReHgncn6_g!2m2!1d6.768340802347779!2d125.3445518851647!3f30.53006577958371!4f-33.06060145308918!5f0.7820865974627469";

export type ViewMode = "map" | "street" | "satellite" | "terrain" | "dark" | "humanitarian";

interface GoogleMapViewProps {
  viewMode: ViewMode;
}

// Custom CJC marker icon (red pin with white center)
const CJC_ICON = L.divIcon({
  className: "cjc-marker-icon",
  html: `<div style="
    width: 32px; height: 42px; position: relative;
  ">
    <svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:42px;">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 26 16 26s16-14 16-26C32 7.16 24.84 0 16 0z" fill="#c41e2a"/>
      <circle cx="16" cy="16" r="8" fill="white"/>
      <circle cx="16" cy="16" r="5" fill="#c41e2a"/>
    </svg>
  </div>`,
  iconSize: [32, 42],
  iconAnchor: [16, 42],
  popupAnchor: [0, -42],
});

// User location icon (blue pulsing dot)
const USER_ICON = L.divIcon({
  className: "user-location-icon",
  html: `<div style="
    width: 18px; height: 18px; position: relative;
  ">
    <div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: #2563eb; border: 3px solid white;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.3), 0 2px 8px rgba(0,0,0,0.3);
    "></div>
    <div style="
      position: absolute; inset: -6px; border-radius: 50%;
      background: rgba(37,99,235,0.15);
      animation: userPulse 2s ease-in-out infinite;
    "></div>
  </div>
  <style>
    @keyframes userPulse {
      0%, 100% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.8); opacity: 0; }
    }
  </style>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Fix Leaflet default marker icon issue with bundlers
function fixLeafletIcons() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Calculate distance between two points (Haversine formula)
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function GoogleMapView({ viewMode }: GoogleMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationActive, setLocationActive] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [streetCampus, setStreetCampus] = useState<"main" | "power">("main");

  // Initialize the Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    fixLeafletIcons();

    const map = L.map(mapContainerRef.current, {
      center: [CENTER_LAT, CENTER_LNG],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add initial tile layer (map view)
    const layer = TILE_LAYERS.map;
    const tileLayer = L.tileLayer(layer.url, {
      attribution: layer.attr,
      maxZoom: layer.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Add CJC Main Campus marker
    const mainMarker = L.marker([CJC_MAIN_LAT, CJC_MAIN_LNG], { icon: CJC_ICON }).addTo(map);
    mainMarker.bindPopup(
      `<div style="text-align:center;font-family:system-ui,sans-serif;padding:4px 0;">
        <strong style="color:#0f2744;font-size:14px;">CJC Main Campus</strong><br/>
        <span style="color:#64605a;font-size:12px;">Sacred Heart Avenue, Digos City<br/>Davao del Sur 8002</span>
      </div>`,
      { maxWidth: 220 }
    );

    // Add CJC Power Campus marker
    const powerMarker = L.marker([CJC_POWER_LAT, CJC_POWER_LNG], { icon: CJC_ICON }).addTo(map);
    powerMarker.bindPopup(
      `<div style="text-align:center;font-family:system-ui,sans-serif;padding:4px 0;">
        <strong style="color:#0f2744;font-size:14px;">CJC Power Campus</strong><br/>
        <span style="color:#64605a;font-size:12px;">Power, Digos City<br/>Davao del Sur 8002</span>
      </div>`,
      { maxWidth: 220 }
    );

    // Fit map to show both campuses
    const campusBounds = L.latLngBounds(
      [CJC_MAIN_LAT, CJC_MAIN_LNG],
      [CJC_POWER_LAT, CJC_POWER_LNG]
    );
    map.fitBounds(campusBounds, { padding: [50, 50] });

    // Open main campus popup by default
    mainMarker.openPopup();

    mapInstanceRef.current = map;
    setMapReady(true);

    // Force resize after mount to fix grey tiles
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      labelLayerRef.current = null;
      userMarkerRef.current = null;
      routeLineRef.current = null;
      setMapReady(false);
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Switch tile layers when viewMode changes
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;

    // Remove existing layers
    map.removeLayer(tileLayerRef.current);
    if (labelLayerRef.current) {
      map.removeLayer(labelLayerRef.current);
      labelLayerRef.current = null;
    }

    // Skip tile changes for street view (handled by iframe)
    if (viewMode === "street") return;

    const layer = TILE_LAYERS[viewMode];
    tileLayerRef.current = L.tileLayer(layer.url, {
      attribution: layer.attr,
      maxZoom: layer.maxZoom,
    }).addTo(map);

    // Add label overlay for satellite view
    if (viewMode === "satellite") {
      labelLayerRef.current = L.tileLayer(SAT_LABELS.url, {
        attribution: SAT_LABELS.attr,
        maxZoom: SAT_LABELS.maxZoom,
        pane: "overlayPane",
      }).addTo(map);
    }

    // Re-invalidate size when switching back from street view
    setTimeout(() => map.invalidateSize(), 100);
  }, [viewMode, mapReady]);

  // Clear user location marker and route
  const clearLocation = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    // Reset view back to CJC
    map.setView([CENTER_LAT, CENTER_LNG], DEFAULT_ZOOM);
    setLocationActive(false);
  };

  // Handle "My Location" button (toggle)
  const handleLocateMe = () => {
    if (!mapInstanceRef.current || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      setTimeout(() => setLocationError(null), 3000);
      return;
    }

    // If location is already shown, toggle it off
    if (locationActive) {
      clearLocation();
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current!;

        // Remove previous user marker and route if any
        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current);
        }
        if (routeLineRef.current) {
          map.removeLayer(routeLineRef.current);
        }

        // Add user location marker
        const userMarker = L.marker([latitude, longitude], { icon: USER_ICON }).addTo(map);

        // Calculate distance to both campuses
        const distMain = getDistance(latitude, longitude, CJC_MAIN_LAT, CJC_MAIN_LNG);
        const distPower = getDistance(latitude, longitude, CJC_POWER_LAT, CJC_POWER_LNG);

        const fmtDist = (km: number) => km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
        const fmtWalk = (km: number) => Math.round((km / 5) * 60);
        const fmtDrive = (km: number) => Math.max(1, Math.round((km / 30) * 60));

        const btnStyle = "display:inline-block;margin-top:4px;padding:5px 10px;color:white;border-radius:6px;font-size:11px;font-weight:600;text-decoration:none;";

        userMarker.bindPopup(
          `<div style="text-align:center;font-family:system-ui,sans-serif;padding:4px 0;min-width:220px;">
            <strong style="color:#2563eb;font-size:13px;">Your Location</strong>
            <div style="margin-top:8px;padding:6px;background:#fef7f7;border-radius:8px;border:1px solid #f0d0d0;">
              <strong style="color:#c41e2a;font-size:12px;">Main Campus</strong><br/>
              <span style="color:#64605a;font-size:11px;">
                ${fmtDist(distMain)} &middot; ~${fmtWalk(distMain)} min walk &middot; ~${fmtDrive(distMain)} min drive
              </span><br/>
              <a href="https://www.google.com/maps/dir/${latitude},${longitude}/${CJC_MAIN_LAT},${CJC_MAIN_LNG}"
                 target="_blank" rel="noopener noreferrer"
                 style="${btnStyle}background:#c41e2a;">
                Directions to Main
              </a>
            </div>
            <div style="margin-top:6px;padding:6px;background:#fef7f7;border-radius:8px;border:1px solid #f0d0d0;">
              <strong style="color:#c41e2a;font-size:12px;">Power Campus</strong><br/>
              <span style="color:#64605a;font-size:11px;">
                ${fmtDist(distPower)} &middot; ~${fmtWalk(distPower)} min walk &middot; ~${fmtDrive(distPower)} min drive
              </span><br/>
              <a href="https://www.google.com/maps/dir/${latitude},${longitude}/${CJC_POWER_LAT},${CJC_POWER_LNG}"
                 target="_blank" rel="noopener noreferrer"
                 style="${btnStyle}background:#c41e2a;">
                Directions to Power
              </a>
            </div>
          </div>`,
          { maxWidth: 280 }
        ).openPopup();

        userMarkerRef.current = userMarker;

        // Draw dashed lines from user to both campuses
        const routeLines = L.layerGroup([
          L.polyline(
            [[latitude, longitude], [CJC_MAIN_LAT, CJC_MAIN_LNG]],
            { color: "#c41e2a", weight: 3, opacity: 0.6, dashArray: "8, 8" }
          ),
          L.polyline(
            [[latitude, longitude], [CJC_POWER_LAT, CJC_POWER_LNG]],
            { color: "#c41e2a", weight: 3, opacity: 0.6, dashArray: "8, 8" }
          ),
        ]).addTo(map);

        routeLineRef.current = routeLines as unknown as L.Polyline;

        // Fit map to show user + both campuses
        const bounds = L.latLngBounds([
          [latitude, longitude],
          [CJC_MAIN_LAT, CJC_MAIN_LNG],
          [CJC_POWER_LAT, CJC_POWER_LNG],
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        setLocating(false);
        setLocationActive(true);
      },
      (error) => {
        setLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Location access denied");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable");
            break;
          case error.TIMEOUT:
            setLocationError("Location request timed out");
            break;
          default:
            setLocationError("Could not get location");
        }
        setTimeout(() => setLocationError(null), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="map-container">
      {/* Leaflet Map (visible for all modes except street) */}
      <div
        ref={mapContainerRef}
        className="map-leaflet-container"
        style={{
          display: viewMode === "street" ? "none" : "block",
          width: "100%",
          height: "100%",
        }}
      />

      {/* My Location button (only for non-street modes) */}
      {viewMode !== "street" && (
        <button
          onClick={handleLocateMe}
          disabled={locating}
          className={`map-locate-btn ${locationActive ? "map-locate-active" : ""}`}
          title={locationActive ? "Hide my location" : "Show my location"}
          aria-label={locationActive ? "Hide my location" : "Show my location"}
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-cjc-red/30 border-t-cjc-red rounded-full animate-spin" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="3" fill="#c41e2a" />
              <circle cx="8" cy="8" r="6.5" stroke="#c41e2a" strokeWidth="1.5" fill="none" />
              <line x1="8" y1="0" x2="8" y2="3" stroke="#c41e2a" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="8" y1="13" x2="8" y2="16" stroke="#c41e2a" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="8" x2="3" y2="8" stroke="#c41e2a" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="13" y1="8" x2="16" y2="8" stroke="#c41e2a" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      )}

      {/* Location error toast */}
      {locationError && (
        <div className="map-location-toast">
          {locationError}
        </div>
      )}

      {/* Google Maps iframe (visible for street mode) */}
      {viewMode === "street" && (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          <iframe
            src={streetCampus === "main" ? STREET_VIEW_MAIN : STREET_VIEW_POWER}
            className="map-street-iframe"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`CJC Street View - ${streetCampus === "main" ? "Main Campus" : "Power Campus"}`}
          />
          {/* Campus switcher for street view */}
          <div style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 4,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 10,
            padding: 4,
            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
            zIndex: 10,
          }}>
            <button
              onClick={() => setStreetCampus("main")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: streetCampus === "main" ? "#c41e2a" : "transparent",
                color: streetCampus === "main" ? "white" : "#64605a",
              }}
            >
              Main Campus
            </button>
            <button
              onClick={() => setStreetCampus("power")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                background: streetCampus === "power" ? "#c41e2a" : "transparent",
                color: streetCampus === "power" ? "white" : "#64605a",
              }}
            >
              Power Campus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
