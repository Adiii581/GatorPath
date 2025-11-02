const { haversine } = require('./utils');

class Graph {
  constructor() {
    this.nodes = new Map(); // node_ID -> {lat, lon}
    this.adjacencyList = new Map(); // node_ID -> Map<neighborNode_ID, weight>
  }

  addNode(nodeId, lat, lon) {
    this.nodes.set(nodeId, { lat, lon });
    if (!this.adjacencyList.has(nodeId)) {
      this.adjacencyList.set(nodeId, new Map());
    }
  }

  addEdge(sourceId, destId, weight) {
    // Undirected: add both directions
    this.adjacencyList.get(sourceId).set(destId, weight);
    this.adjacencyList.get(destId).set(sourceId, weight);
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getNeighbors(nodeId) {
    return this.adjacencyList.get(nodeId) || new Map();
  }
}

module.exports = Graph;