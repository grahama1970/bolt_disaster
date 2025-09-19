import { PortableGraph, GraphData, GraphNode, GraphEdge } from '../../types/graph';

export function normalizePortableGraph(portable: PortableGraph): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  
  // Normalize nodes from different collections
  if (portable.nodes.sections) {
    portable.nodes.sections.forEach(node => {
      nodes.push({
        _id: `sections/${node.id}`,
        _key: node.id,
        label: node.title || node.id,
        title: node.title,
        type: 'section',
        content: node.content,
        doc_id: node.doc_id,
      });
    });
  }
  
  if (portable.nodes.lemmas) {
    portable.nodes.lemmas.forEach(node => {
      nodes.push({
        _id: `lemmas/${node.id}`,
        _key: node.id,
        label: node.title || node.id,
        title: node.title,
        type: 'lemma',
        content: node.content,
        doc_id: node.doc_id,
      });
    });
  }
  
  if (portable.nodes.theorems) {
    portable.nodes.theorems.forEach(node => {
      nodes.push({
        _id: `theorems/${node.id}`,
        _key: node.id,
        label: node.title || node.id,
        title: node.title,
        type: 'theorem',
        content: node.content,
        doc_id: node.doc_id,
      });
    });
  }
  
  // Normalize edges from different types
  let edgeIndex = 0;
  
  Object.entries(portable.edges).forEach(([edgeType, edgeList]) => {
    if (edgeList) {
      edgeList.forEach(edge => {
        // Convert portable edge format to DB-native format
        const fromCollection = findNodeCollection(edge.from, portable);
        const toCollection = findNodeCollection(edge.to, portable);
        
        edges.push({
          _id: `edges/e${edgeIndex++}`,
          _from: `${fromCollection}/${edge.from}`,
          _to: `${toCollection}/${edge.to}`,
          type: edge.type,
          weight: edge.weight,
          label: edge.type,
        });
      });
    }
  });
  
  return { nodes, edges };
}

function findNodeCollection(nodeId: string, portable: PortableGraph): string {
  if (portable.nodes.sections?.some(n => n.id === nodeId)) return 'sections';
  if (portable.nodes.lemmas?.some(n => n.id === nodeId)) return 'lemmas';
  if (portable.nodes.theorems?.some(n => n.id === nodeId)) return 'theorems';
  return 'sections'; // default fallback
}