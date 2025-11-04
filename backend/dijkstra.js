const MinPriorityQueue = require("./priorityQueue");

function dijkstra(graph, startNode, endNode) {
  const t0 = process.hrtime();

  const distances = new Map();
  const previous = new Map();
  const pq = new MinPriorityQueue();
  const visited = new Set();

  // Initialize
  for (let node of graph.nodes.keys()) {
    distances.set(node, Infinity);
  }
  distances.set(startNode, 0);
  pq.enqueue(0, startNode);

  while (!pq.isEmpty()) {
    const { node: current, priority: dist } = pq.dequeue();
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNode) break;

    for (let [neighbor, weight] of graph.getNeighbors(current)) {
      const newDist = dist + weight;
      if (newDist < distances.get(neighbor)) {
        distances.set(neighbor, newDist);
        previous.set(neighbor, current);
        pq.enqueue(newDist, neighbor);
      }
    }
  }

  // Reconstruct path
  const path = [];
  let current = endNode;
  while (current !== undefined) {
    path.unshift(current);
    current = previous.get(current);
  }
  if (path[0] !== startNode)
    return { error: "No path found", nodesVisited: visited.size };

  const diff = process.hrtime(t0);
  const timeTaken = diff[0] * 1000 + diff[1] / 1e6;
  return {
    path,
    distance: distances.get(endNode),
    nodesVisited: visited.size,
    timeTaken,
  };
}

module.exports = dijkstra;
