import { GraphData, GraphNode } from '../../types/graph';

export function normalizeDbNativeGraph(data: GraphData): GraphData {
  const nodes: GraphNode[] = data.nodes.map(node => ({
    ...node,
    // Ensure label is set using the priority: title -> normalized_prop -> key
    label: node.label || node.title || node.normalized_prop || node._key,
  }));
  
  return {
    nodes,
    edges: data.edges,
  };
}

export function detectGraphFormat(data: any): 'portable' | 'db-native' | 'unknown' {
  if (data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
    // Check if it's DB-native format
    if (data.nodes.length > 0 && data.nodes[0]._id && data.nodes[0]._key) {
      return 'db-native';
    }
  }
  
  if (data.nodes && typeof data.nodes === 'object' && data.edges && typeof data.edges === 'object') {
    // Check if it's portable format
    const hasPortableStructure = 
      (data.nodes.sections || data.nodes.lemmas || data.nodes.theorems) &&
      (data.edges.depends_on || data.edges.contradicts || data.edges.refines || data.edges.knn);
    
    if (hasPortableStructure) {
      return 'portable';
    }
  }
  
  return 'unknown';
}