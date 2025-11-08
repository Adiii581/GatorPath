import React, { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { loadNodes, findNearest } from "./lib/nodes";
import { geocodeOne, compare } from "./lib/api";
import L from "leaflet";

const UF_CENTER = [29.6436, -82.3549];

// --- COLORS ---
const DIJKSTRA_COLOR = "#2c5282"; // Dark Blue
const ASTAR_COLOR = "#dd6b20";    // Dark Orange

// Component to automatically zoom to fit the path
const ZoomToPath = ({ pathPoints }) => {
  const map = useMap();
  useEffect(() => {
    if (pathPoints && pathPoints.length > 0) {
      const bounds = L.latLngBounds(pathPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pathPoints, map]);
  return null;
};

// Updated VisitedNodes for bolder appearance
const VisitedNodes = ({ nodeIds, nodes, color }) => {
  const latLngs = useMemo(
    () =>
      nodeIds
        .map((id) => nodes.byId.get(id))
        .filter(Boolean)
        .map((n) => [n.lat, n.lon]),
    [nodeIds, nodes.byId]
  );

  return latLngs.map((pos, idx) => (
    <Circle
      key={idx}
      center={pos}
      radius={4} // Increased size from 2 to 4
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.7, // Increased opacity from 0.4 to 0.7 for bolder look
        weight: 0,
      }}
    />
  ));
};

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

  const [dijkstraVisited, setDijkstraVisited] = useState([]);
  const [aStarVisited, setAStarVisited] = useState([]);
  const [animationFrame, setAnimationFrame] = useState(null);
  const [showFinalPaths, setShowFinalPaths] = useState(false);

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

  useEffect(() => {
    const allDijkstraNodes = result?.dijkstra?.visitedNodes || [];
    const allAStarNodes = result?.aStar?.visitedNodes || [];

    if (allDijkstraNodes.length === 0 && allAStarNodes.length === 0) {
      if (result) setShowFinalPaths(true);
      return;
    }

    let startTime = null;
    let frameId;
    const animationDuration = 2000;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      const dijkstraCount = Math.floor(progress * allDijkstraNodes.length);
      const aStarCount = Math.floor(progress * allAStarNodes.length);

      setDijkstraVisited(allDijkstraNodes.slice(0, dijkstraCount));
      setAStarVisited(allAStarNodes.slice(0, aStarCount));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
        setAnimationFrame(frameId);
      } else {
        setDijkstraVisited(allDijkstraNodes);
        setAStarVisited(allAStarNodes);
        setShowFinalPaths(true);
        setAnimationFrame(null);
      }
    };

    frameId = requestAnimationFrame(animate);
    setAnimationFrame(frameId);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [result]);

  async function findAndCompare(startId, endId) {
    const t0 = performance.now();
    const data = await compare(startId, endId);
    const requestMs = performance.now() - t0;
    setResult({ ...data, clientRequestMs: requestMs });
  }

  async function handleFind() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    setDijkstraVisited([]);
    setAStarVisited([]);
    setShowFinalPaths(false);
    setResult(null);
    setError("");
    setStartPt(null);
    setEndPt(null);
    setStartNode(null);
    setEndNode(null);
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

  // Combine paths for auto-zoom
  const allPathPoints = useMemo(() => {
      return [...dijkstraLatLngs, ...aStarLatLngs];
  }, [dijkstraLatLngs, aStarLatLngs]);


  const dijkstraError = result?.dijkstra?.error;
  const aStarError = result?.aStar?.error;

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2 className="app-title">GatorPath</h2>
        <div className="loading-status">
          {loadingNodes
            ? "Loading node coordinates…"
            : `Loaded ${nodes.asArray.length} nodes`}
        </div>

        {/* Start Input Group - Themed Blue */}
        <div className="form-group start-group">
          <label htmlFor="start-input">Start</label>
          <input
            id="start-input"
            value={startText}
            onChange={(e) => setStartText(e.target.value)}
            placeholder="e.g., Beaty Towers" // Updated placeholder
          />
        </div>

        {/* End Input Group - Themed Orange */}
        <div className="form-group end-group">
          <label htmlFor="end-input">End</label>
          <input
            id="end-input"
            value={endText}
            onChange={(e) => setEndText(e.target.value)}
            placeholder="e.g., Ben Hill Griffin Stadium"
          />
        </div>

        <button
          disabled={finding || loadingNodes}
          onClick={handleFind}
          className="find-button"
        >
          {finding ? "Finding…" : "Find Route"}
        </button>

        {error && <div className="error-message">{error}</div>}
        {dijkstraError && (
          <div className="error-message">Dijkstra: {dijkstraError}</div>
        )}
        {aStarError && (
          <div className="error-message">A*: {aStarError}</div>
        )}

        {result && (
          <div className="results-card">
            <div className="result-line-dijkstra">
              <strong>Dijkstra</strong>:{" "}
              {dijkstraError
                ? "N/A"
                : `${result.dijkstra.distance.toFixed(1)} m`}
              , visited{" "}
              {result.dijkstra.visitedNodes?.length ||
                result.dijkstra.nodesVisited || 0
              }{" "}
              nodes, time {Number(result.dijkstra.timeTaken).toFixed(3)} ms
            </div>
            <div className="result-line-astar">
              <strong>A*</strong>:{" "}
              {aStarError
                ? "N/A"
                : `${result.aStar.distance.toFixed(1)} m`
              }
              , visited{" "}
              {result.aStar.visitedNodes?.length ||
                result.aStar.nodesVisited || 0
              }{" "}
              nodes, time {Number(result.aStar.timeTaken).toFixed(3)} ms
            </div>

            {!dijkstraError && !aStarError && (
              <>
                <hr />
                {/* --- LABELS UPDATED HERE --- */}
                <div>
                  Path Distance Difference: {result.comparison.pathLengthDiff.toFixed(1)} m
                </div>
                <div>
                  Visited Nodes Difference: {result.comparison.nodesCheckedDiff} nodes
                </div>
                <div>
                  Time Difference: {Number(result.comparison.timeDiff).toFixed(3)} ms
                </div>
                {/* --- END OF UPDATES --- */}
              </>
            )}
          </div>
        )}
      </div>

      <div className="map-container">
        <MapContainer
          center={UF_CENTER}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          
          {/* Auto-zoom component */}
          <ZoomToPath pathPoints={allPathPoints} />

          <VisitedNodes
            nodeIds={dijkstraVisited}
            nodes={nodes}
            color={DIJKSTRA_COLOR}
          />
          <VisitedNodes
            nodeIds={aStarVisited}
            nodes={nodes}
            color={ASTAR_COLOR}
          />

          {showFinalPaths && dijkstraLatLngs.length > 0 && (
            <Polyline
              positions={dijkstraLatLngs}
              color={DIJKSTRA_COLOR}
              weight={5}
              opacity={0.85}
            />
          )}
          {showFinalPaths && aStarLatLngs.length > 0 && (
            <Polyline
              positions={aStarLatLngs}
              color={ASTAR_COLOR}
              weight={4}
              opacity={0.95}
              dashArray="6 8"
            />
          )}

          {startPt && (
            <Circle
              center={[startPt.lat, startPt.lon]}
              radius={8}
              pathOptions={{
                color: "white",
                fillColor: DIJKSTRA_COLOR,
                fillOpacity: 1,
                weight: 2,
              }}
            />
          )}
          {endPt && (
            <Circle
              center={[endPt.lat, endPt.lon]}
              radius={8}
              pathOptions={{
                color: "white",
                fillColor: ASTAR_COLOR,
                fillOpacity: 1,
                weight: 2,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}