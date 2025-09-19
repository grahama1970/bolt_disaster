import Fuse from 'fuse.js';
import { GraphNode } from '../../types/graph';

export interface BM25Config {
  fields: (keyof GraphNode)[];
  threshold: number;
  includeScore: boolean;
  maxResults?: number;
}

export interface SearchResult {
  node: GraphNode;
  score: number;
  matches: Array<{
    field: string;
    value: string;
    indices: number[][];
  }>;
}

export function performBM25Search(
  nodes: GraphNode[],
  query: string,
  config: BM25Config
): SearchResult[] {
  const fuse = new Fuse(nodes, {
    keys: config.fields.map(field => String(field)),
    threshold: config.threshold,
    includeScore: config.includeScore,
    includeMatches: true,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 2,
  });
  
  const results = fuse.search(query);
  
  const searchResults: SearchResult[] = results.map(result => ({
    node: result.item,
    score: result.score || 0,
    matches: (result.matches || []).map(match => ({
      field: match.key || '',
      value: match.value || '',
      indices: match.indices || []
    }))
  }));
  
  // Apply max results limit if specified
  if (config.maxResults) {
    return searchResults.slice(0, config.maxResults);
  }
  
  return searchResults;
}

export function fuseTraversalWithBM25(
  traversalResults: GraphNode[],
  searchResults: SearchResult[],
  weights: { traversal: number; search: number } = { traversal: 0.6, search: 0.4 }
): GraphNode[] {
  const searchScoreMap = new Map<string, number>();
  searchResults.forEach(result => {
    searchScoreMap.set(result.node._id, result.score);
  });
  
  // Score and rank combined results
  const scoredNodes = traversalResults.map(node => {
    const traversalScore = 1.0; // Base score for being in traversal results
    const searchScore = searchScoreMap.get(node._id) || 0;
    
    const combinedScore = 
      (traversalScore * weights.traversal) + 
      ((1 - searchScore) * weights.search); // Fuse scores are inverted (lower is better)
    
    return { node, score: combinedScore };
  });
  
  // Sort by combined score (higher is better)
  scoredNodes.sort((a, b) => b.score - a.score);
  
  return scoredNodes.map(item => item.node);
}