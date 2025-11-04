const MinPriorityQueue = require("./priorityQueue");
const { haversine } = require("./utils");

function aStar(graph, startNode, endNode) {
  const t0 = process.hrtime.bigint();

  const startNodeData = graph.getNode(startNode);
  const endNodeData = graph.getNode(endNode);
  if (!startNodeData || !endNodeData) return { error: "Invalid nodes" };

  const gScore = new Map(); // Cost from start
  const fScore = new Map(); // Estimated total cost
  const previous = new Map();
  const pq = new MinPriorityQueue();
  const visited = new Set();

  // Initialize
  for (let node of graph.nodes.keys()) {
    gScore.set(node, Infinity);
    fScore.set(node, Infinity);
  }
  gScore.set(startNode, 0);
  fScore.set(
    startNode,
    haversine(
      startNodeData.lat,
      startNodeData.lon,
      endNodeData.lat,
      endNodeData.lon
    )
  );
  pq.enqueue(fScore.get(startNode), startNode);

  while (!pq.isEmpty()) {
    const { node: current } = pq.dequeue();
    if (visited.has(current)) continue;
    visited.add(current);

    if (current === endNode) break;

    for (let [neighbor, weight] of graph.getNeighbors(current)) {
      const tentativeG = gScore.get(current) + weight;
      if (tentativeG < gScore.get(neighbor)) {
        previous.set(neighbor, current);
        gScore.set(neighbor, tentativeG);
        const neighborNode = graph.getNode(neighbor);
        const h = haversine(
          neighborNode.lat,
          neighborNode.lon,
          endNodeData.lat,
          endNodeData.lon
        );
        fScore.set(neighbor, tentativeG + h);
        if (!visited.has(neighbor)) pq.enqueue(fScore.get(neighbor), neighbor);
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

  timeTaken = Number(process.hrtime.bigint() - t0) / 1e6;

  return {
    path,
    distance: gScore.get(endNode),
    nodesVisited: visited.size,
    timeTaken,
  };
}

module.exports = aStar;
