export interface GraphNode {
  _id: string;
  _key: string;
  label?: string;
  title?: string;
  doc_id?: string;
  type: 'section' | 'lemma' | 'theorem';
  normalized_prop?: string;
  content?: string;
}

export interface GraphEdge {
  _id: string;
  _from: string;
  _to: string;
  type: 'depends_on' | 'contradicts' | 'refines' | 'knn';
  weight?: number;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PortableNode {
  id: string;
  title?: string;
  type: 'section' | 'lemma' | 'theorem';
  content?: string;
  doc_id?: string;
}

export interface PortableEdge {
  from: string;
  to: string;
  type: 'depends_on' | 'contradicts' | 'refines' | 'knn';
  weight?: number;
}

export interface PortableGraph {
  nodes: {
    sections?: PortableNode[];
    lemmas?: PortableNode[];
    theorems?: PortableNode[];
  };
  edges: {
    depends_on?: PortableEdge[];
    contradicts?: PortableEdge[];
    refines?: PortableEdge[];
    knn?: PortableEdge[];
  };
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface CameraState {
  x: number;
  y: number;
  ratio: number;
}

export interface Annotation {
  id: string;
  nodeId: string;
  content: string;
  tags: string[];
  timestamp: number;
}