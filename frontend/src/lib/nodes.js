import Papa from "papaparse";

// Haversine distance in meters
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const NODES_URL = "/nodes.csv";

// const NODES_URL = `${import.meta.env.BASE_URL || "/"}nodes.csv`;

export async function loadNodes(url = NODES_URL) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: false, // we’ll parse numbers ourselves
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(), // fixes stray spaces/BOM
      complete: (res) => {
        const byId = new Map();
        const arr = [];

        for (const row of res.data) {
          // Support multiple possible header names
          const id = Number(
            row["node_id"] ?? row["osmid"] ?? row["id"] ?? row["u"]
          );
          const lat = Number(row["latitude"] ?? row["y"] ?? row["lat"]);
          const lon = Number(row["longitude"] ?? row["x"] ?? row["lon"]);

          if (
            Number.isFinite(id) &&
            Number.isFinite(lat) &&
            Number.isFinite(lon)
          ) {
            const n = { id, lat, lon };
            byId.set(id, n); // numeric key
            byId.set(String(id), n); // string key (if other code uses strings)
            arr.push(n);
          }
        }

        console.log("nodes loaded:", arr.length, "sample:", arr[0]);
        resolve({ byId, asArray: arr });
      },
      error: reject,
    });
  });
}

export function findNearest(lat, lon, nodesArray) {
  if (!nodesArray || nodesArray.length === 0) return { nodeId: null };
  let best = null;
  let bestD = Infinity;
  for (const n of nodesArray) {
    const d = haversine(lat, lon, n.lat, n.lon);
    if (Number.isFinite(d) && d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best
    ? { nodeId: best.id, lat: best.lat, lon: best.lon, distanceMeters: bestD }
    : { nodeId: null };
}
