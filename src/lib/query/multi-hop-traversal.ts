import { GraphNode, GraphEdge } from '../../types/graph';

export interface TraversalConfig {
  startNodes: string[];
  edgeTypes: string[];
  maxDepth: number;
  direction: 'OUTBOUND' | 'INBOUND' | 'ANY';
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: Array<{
    start: string;
    end: string;
    length: number;
    nodes: string[];
    edges: string[];
  }>;
}

export function performMultiHopTraversal(
  allNodes: GraphNode[],
  allEdges: GraphEdge[],
  config: TraversalConfig
): TraversalResult {
  const result: TraversalResult = {
    nodes: [],
    edges: [],
    paths: []
  };
  
  const visited = new Set<string>();
  const resultNodes = new Map<string, GraphNode>();
  const resultEdges = new Map<string, GraphEdge>();
  
  // Build adjacency list for efficient traversal
  const adjacencyList = new Map<string, Array<{edge: GraphEdge, node: GraphNode}>>();
  
  allNodes.forEach(node => {
    adjacencyList.set(node._id, []);
  });
  
  allEdges.forEach(edge => {
    if (config.edgeTypes.includes(edge.type)) {
      const fromConnections = adjacencyList.get(edge._from) || [];
      const toConnections = adjacencyList.get(edge._to) || [];
      const toNode = allNodes.find(n => n._id === edge._to);
      const fromNode = allNodes.find(n => n._id === edge._from);
      
      if (toNode && fromNode) {
        if (config.direction === 'OUTBOUND' || config.direction === 'ANY') {
          fromConnections.push({ edge, node: toNode });
        }
        if (config.direction === 'INBOUND' || config.direction === 'ANY') {
          toConnections.push({ edge, node: fromNode });
        }
        
        adjacencyList.set(edge._from, fromConnections);
        adjacencyList.set(edge._to, toConnections);
      }
    }
  });
  
  // Perform DFS traversal from each start node
  const dfs = (
    nodeId: string,
    depth: number,
    path: string[],
    edges: string[]
  ) => {
    if (depth > config.maxDepth) return;
    
    visited.add(nodeId);
    const currentNode = allNodes.find(n => n._id === nodeId);
    if (currentNode) {
      resultNodes.set(nodeId, currentNode);
    }
    
    const connections = adjacencyList.get(nodeId) || [];
    
    connections.forEach(({ edge, node }) => {
      resultEdges.set(edge._id, edge);
      
      const newPath = [...path, node._id];
      const newEdges = [...edges, edge._id];
      
      // Record the path
      if (newPath.length > 1) {
        result.paths.push({
          start: path[0],
          end: node._id,
          length: newPath.length - 1,
          nodes: newPath,
          edges: newEdges
        });
      }
      
      if (!visited.has(node._id) && depth < config.maxDepth) {
        dfs(node._id, depth + 1, newPath, newEdges);
      }
    });
  };
  
  // Start traversal from each start node
  config.startNodes.forEach(startNode => {
    visited.clear();
    dfs(startNode, 0, [startNode], []);
  });
  
  result.nodes = Array.from(resultNodes.values());
  result.edges = Array.from(resultEdges.values());
  
  return result;
}