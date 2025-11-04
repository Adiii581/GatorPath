// --- 1. Imports ---
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const express = require("express");
const cors = require("cors");

const Graph = require("./Graph");
const dijkstra = require("./dijkstra");
const aStar = require("./aStar");
const { haversine } = require("./utils");

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// --- 2. Graph Loading  ---
const gatorGraph = new Graph();
const nodes = new Map();

async function loadGraphData() {
  console.log("Starting to load graph data...");

  const nodePromise = new Promise((resolve, reject) => {
    fs.createReadStream(path.resolve(data, "nodes.csv"))
      .pipe(csv())
      .on("data", (row) => {
        const nodeId = parseInt(row.node_ID);
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);
        nodes.set(nodeId, { lat, lon });
        gatorGraph.addNode(nodeId, lat, lon);
      })
      .on("end", () => {
        console.log(`Loaded ${nodes.size} nodes.`);
        resolve();
      })
      .on("error", reject);
  });

  await nodePromise;

  const edgePromise = new Promise((resolve, reject) => {
    let edgeCount = 0;
    fs.createReadStream(path.resolve(data, "edges.csv"))
      .pipe(csv())
      .on("data", (row) => {
        const sourceId = parseInt(row.source_node_ID);
        const destId = parseInt(row.destination_node_ID);
        const source = nodes.get(sourceId);
        const dest = nodes.get(destId);
        if (source && dest) {
          const weight = haversine(source.lat, source.lon, dest.lat, dest.lon);
          gatorGraph.addEdge(sourceId, destId, weight);
          edgeCount++;
        }
      })
      .on("end", () => {
        console.log(`Loaded ${edgeCount} edges.`);
        resolve();
      })
      .on("error", reject);
  });

  await edgePromise;
  console.log("Graph data loaded successfully!");
}

// --- 3. API Endpoints ---
app.post("/pathfind", (req, res) => {
  const { start, end, algorithm } = req.body;
  console.log("Pathfind body:", req.body); // Debug
  if (!start || !end)
    return res.status(400).json({ error: "Missing start/end node" });

  let result;
  if (algorithm === "dijkstra") {
    const t0 = process.hrtime.bigint();
    result = dijkstra(gatorGraph, start, end);
    result.timeTaken = Number(process.hrtime.bigint() - t0) / 1e6;
  } else if (algorithm === "astar") {
    const t0 = process.hrtime.bigint();
    result = aStar(gatorGraph, start, end);
    result.timeTaken = Number(process.hrtime.bigint() - t0) / 1e6;
  } else {
    return res
      .status(400)
      .json({ error: "Invalid algorithm (dijkstra or astar)" });
  }

  if (result.error) return res.status(200).json(result); // Changed: 404 → 200 (return data, not error page)
  res.json({
    path: result.path,
    distance: result.distance,
    nodesVisited: result.nodesVisited,
    timeTaken: result.timeTaken,
    algorithm,
  });
});

app.post("/compare", (req, res) => {
  console.log("Compare body:", req.body); // Debug (remove later)
  const { start, end } = req.body;
  console.log("Routing start/end:", start, end); // Added: Log IDs
  if (!start || !end)
    return res.status(400).json({ error: "Missing start/end node" });

  const tD0 = process.hrtime.bigint();
  const dijkstraResult = dijkstra(gatorGraph, start, end);
  dijkstraResult.timeTaken = Number(process.hrtime.bigint() - tD0) / 1e6;

  const tA0 = process.hrtime.bigint();
  const aStarResult = aStar(gatorGraph, start, end);
  aStarResult.timeTaken = Number(process.hrtime.bigint() - tA0) / 1e6;

  if (dijkstraResult.error || aStarResult.error)
    return res.status(200).json({ error: "No path found" }); // Changed: 404 → 200

  res.json({
    dijkstra: dijkstraResult,
    aStar: aStarResult,
    comparison: {
      pathLengthDiff: Math.abs(dijkstraResult.distance - aStarResult.distance),
      nodesCheckedDiff: dijkstraResult.nodesVisited - aStarResult.nodesVisited,
      timeDiff: Math.abs(aStarResult.timeTaken - dijkstraResult.timeTaken),
    },
  });
});

// --- 4. Start Server (Unchanged) ---
async function startServer() {
  await loadGraphData();
  app.listen(PORT, () =>
    console.log(
      `🐊 GatorPath Server is running and listening on http://localhost:${PORT}`
    )
  );
}

startServer();
