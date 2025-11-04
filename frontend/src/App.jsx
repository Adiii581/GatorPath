// import React from "react";
// import { MapContainer, TileLayer } from "react-leaflet";

// export default function App() {
//   return (
//     <div style={{ height: "100vh" }}>
//       <h2 style={{ position: "absolute", zIndex: 1000, margin: 8 }}>
//         GatorPath sanity check
//       </h2>
//       <MapContainer
//         center={[29.6436, -82.3549]}
//         zoom={15}
//         style={{ height: "100%", width: "100%" }}
//       >
//         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//       </MapContainer>
//     </div>
//   );
// }

import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Polyline, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { loadNodes, findNearest } from "./lib/nodes";
import { geocodeOne, compare } from "./lib/api";

const UF_CENTER = [29.6436, -82.3549];

export default function App() {
  const [nodes, setNodes] = useState({ byId: new Map(), asArray: [] });
  const [loadingNodes, setLoadingNodes] = useState(true);

  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [startPt, setStartPt] = useState(null);
  const [endPt, setEndPt] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [finding, setFinding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadNodes("/nodes.csv");
        if (!cancelled) {
          setNodes(loaded);
          setLoadingNodes(false);
        }
      } catch {
        setError("Failed to load nodes.csv");
        setLoadingNodes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // helper to measure client-side request time
  async function findAndCompare(startId, endId) {
    const t0 = performance.now();
    const data = await compare(startId, endId);
    const requestMs = performance.now() - t0;
    if (data.error) throw new Error(data.error);
    setResult({ ...data, clientRequestMs: requestMs });
  }

  async function handleFind() {
    setError("");
    setFinding(true);
    try {
      const s = await geocodeOne(startText);
      const e = await geocodeOne(endText);
      setStartPt(s);
      setEndPt(e);

      const sNearest = findNearest(s.lat, s.lon, nodes.asArray);
      const eNearest = findNearest(e.lat, e.lon, nodes.asArray);
      if (!sNearest.nodeId || !eNearest.nodeId)
        throw new Error("Nearest node lookup failed");

      setStartNode(sNearest.nodeId);
      setEndNode(eNearest.nodeId);

      await findAndCompare(sNearest.nodeId, eNearest.nodeId);
    } catch (e) {
      setResult(null);
      setError(e.message || "Something went wrong");
    } finally {
      setFinding(false);
    }
  }

  const dijkstraLatLngs = useMemo(
    () =>
      (result?.dijkstra?.path || [])
        .map((id) => nodes.byId.get(id))
        .filter(Boolean)
        .map((n) => [n.lat, n.lon]),
    [result, nodes]
  );
  const aStarLatLngs = useMemo(
    () =>
      (result?.aStar?.path || [])
        .map((id) => nodes.byId.get(id))
        .filter(Boolean)
        .map((n) => [n.lat, n.lon]),
    [result, nodes]
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "320px 1fr",
        height: "100vh",
      }}
    >
      <div style={{ padding: 16, borderRight: "1px solid #eee" }}>
        <h2>GatorPath</h2>
        <div style={{ fontSize: 12, color: "#555" }}>
          {loadingNodes
            ? "Loading node coordinates…"
            : `Loaded ${nodes.asArray.length} nodes`}
        </div>

        <label style={{ display: "block", marginTop: 12 }}>Start</label>
        <input
          value={startText}
          onChange={(e) => setStartText(e.target.value)}
          placeholder="e.g., Reitz Union"
          style={{ width: "100%" }}
        />
        <label style={{ display: "block", marginTop: 8 }}>End</label>
        <input
          value={endText}
          onChange={(e) => setEndText(e.target.value)}
          placeholder="e.g., Ben Hill Griffin Stadium"
          style={{ width: "100%" }}
        />
        <button
          disabled={finding || loadingNodes}
          onClick={handleFind}
          style={{ marginTop: 12 }}
        >
          {finding ? "Finding…" : "Find Route"}
        </button>

        {error && (
          <div style={{ color: "#b91c1c", marginTop: 10 }}>{error}</div>
        )}

        {result && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: "1px solid #eee",
              borderRadius: 6,
              background: "#fafafa",
            }}
          >
            <div>
              <strong>Dijkstra</strong>: {result.dijkstra.distance.toFixed(1)}{" "}
              m, visited {result.dijkstra.nodesVisited}, time{" "}
              {Number(result.dijkstra.timeTaken).toFixed(3)} ms
            </div>
            <div>
              <strong>A*</strong>: {result.aStar.distance.toFixed(1)} m, visited{" "}
              {result.aStar.nodesVisited}, time{" "}
              {Number(result.aStar.timeTaken).toFixed(3)} ms
            </div>
            <hr />
            <div>Δ length: {result.comparison.pathLengthDiff.toFixed(1)} m</div>
            <div>Δ visited: {result.comparison.nodesCheckedDiff}</div>
            <div>
              Δ time: {Number(result.comparison.timeDiff).toFixed(3)} ms
            </div>
          </div>
        )}

        {startNode && endNode && (
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Start node: {startNode}, End node: {endNode}
          </div>
        )}
      </div>

      <div style={{ height: "100vh" }}>
        <MapContainer
          center={UF_CENTER}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {dijkstraLatLngs.length > 0 && (
            <Polyline
              positions={dijkstraLatLngs}
              color="#2b6cb0"
              weight={5}
              opacity={0.85}
            />
          )}
          {aStarLatLngs.length > 0 && (
            <Polyline
              positions={aStarLatLngs}
              color="#ed8936"
              weight={4}
              opacity={0.95}
              dashArray="6 8"
            />
          )}
          {startPt && (
            <Circle
              center={[startPt.lat, startPt.lon]}
              radius={6}
              pathOptions={{ color: "#2b6cb0" }}
            />
          )}
          {endPt && (
            <Circle
              center={[endPt.lat, endPt.lon]}
              radius={6}
              pathOptions={{ color: "#ed8936" }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
