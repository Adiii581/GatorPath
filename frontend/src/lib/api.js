// frontend/src/lib/api.js
const BASE = "http://localhost:3001";
// export const BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export async function compare(startNodeId, endNodeId) {
  const res = await fetch(`${BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: startNodeId, end: endNodeId }),
  });
  if (!res.ok) throw new Error("Compare failed");
  return res.json();
}

const GEOCODE_BASE = "https://nominatim.openstreetmap.org/search";
// const GEOCODE_BASE = import.meta.env.DEV
//   ? "/geocode"
//   : "https://nominatim.openstreetmap.org/search";

export async function geocodeOne(q) {
  const url = `${GEOCODE_BASE}?format=json&q=${encodeURIComponent(q)}&limit=1`;
  const r = await fetch(url, { headers: { "Accept-Language": "en" } });
  const data = await r.json();
  if (!data.length) throw new Error(`No results for "${q}"`);
  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    label: data[0].display_name,
  };
}
