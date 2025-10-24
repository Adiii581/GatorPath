// --- 1. Imports ---
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const express = require('express');
const cors = require('cors'); // <-- ADDED: For connecting to frontend

/*
 * ==========================================================
 * !! AAYUDESH'S PART (Hand-off) !!
 * This file (e.g., 'Graph.js') must be created by Aayudesh.
 * Make sure the file name matches.
 * ==========================================================
 */
const Graph = require('./Graph'); // <-- UNCOMMENTED
const gatorGraph = new Graph(); // <-- UNCOMMENTED
/*
 * ==========================================================
 */

// --- 2. Express App Setup ---
const app = express();
const PORT = process.env.PORT || 3001; // <-- CHANGED: Port 3001 to avoid React conflict
app.use(cors()); // <-- ADDED: Allow cross-origin requests
app.use(express.json()); // Middleware to parse JSON bodies

// --- 3. Haversine Formula ---
/**
 * Calculates the distance between two lat/lon points in meters.
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// --- 4. Graph Loading Logic ---
// This map stores node data temporarily for fast edge weight calculation
const nodes = new Map();

async function loadGraphData() {
  console.log('Starting to load graph data...');

  // 1. Read nodes.csv
  const nodePromise = new Promise((resolve, reject) => {
    fs.createReadStream(path.resolve(__dirname, 'nodes.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const nodeId = row.node_ID;
        const lat = parseFloat(row.latitude);
        const lon = parseFloat(row.longitude);

        // Store node data for edge calculation
        nodes.set(nodeId, { lat, lon });

        /*
         * ==========================================================
         * !! AAYUDESH'S PART (Hand-off) !!
         * Adding the node to Aayudesh's graph structure.
         * ==========================================================
         */
        gatorGraph.addNode(nodeId, lat, lon); // <-- UNCOMMENTED
        /*
         * ==========================================================
         */
      })
      .on('end', () => {
        console.log(`Loaded ${nodes.size} nodes.`);
        resolve();
      })
      .on('error', reject);
  });

  // Wait for nodes to finish loading before processing edges
  await nodePromise;

  // 2. Read edges.csv
  const edgePromise = new Promise((resolve, reject) => {
    let edgeCount = 0;
    fs.createReadStream(path.resolve(__dirname, 'edges.csv'))
      .pipe(csv())
      .on('data', (row) => {
        const sourceId = row.source_node_ID;
        const destId = row.destination_node_ID;

        const source = nodes.get(sourceId);
        const dest = nodes.get(destId);

        // Ensure both nodes exist (data sanity check)
        if (source && dest) {
          // Calculate weight (distance) using Haversine
          const weight = getHaversineDistance(source.lat, source.lon, dest.lat, dest.lon);

          /*
           * ==========================================================
           * !! AAYUDESH'S PART (Hand-off) !!
           * Adding the weighted edge to Aayudesh's graph.
           * ==========================================================
           */
          gatorGraph.addEdge(sourceId, destId, weight); // <-- UNCOMMENTED
          /*
           * ==========================================================
           */
          edgeCount++;
        }
      })
      .on('end', () => {
        console.log(`Loaded ${edgeCount} edges.`);
        resolve();
      })
      .on('error', reject);
  });

  // Wait for edges to finish loading
  await edgePromise;
  console.log('Graph data loaded successfully!');
}

// --- 5. Handoff to Aayudesh for API Endpoints ---

/*
 * ==========================================================
 * !! AAYUDESH'S PART !!
 * He will add his routing endpoints here.
 * The 'gatorGraph' object is now fully loaded and ready to use.
 * ==========================================================
 */
// Example of Aayudesh's endpoint:
// app.post('/find-path', (req, res) => {
//   const { startNode, endNode } = req.body;
//   
//   // Call his algorithm methods on the 'gatorGraph' object
//   const dijkstraResult = gatorGraph.dijkstra(startNode, endNode);
//   const aStarResult = gatorGraph.aStar(startNode, endNode);
//   
//   res.json({ dijkstra: dijkstraResult, aStar: aStarResult });
// });
/*
 * ==========================================================
 */

// --- 6. Start the Server ---
// We use an async function here so we can 'await' the graph loading.
async function startServer() {
  // Load data *before* server starts accepting requests
  await loadGraphData();

  app.listen(PORT, () => {
    console.log(`🐊 GatorPath Server is running and listening on http://localhost:${PORT}`);
  });
}

// Run the server
startServer();