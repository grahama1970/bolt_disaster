// AQL recipe templates for common queries
export interface AQLRecipe {
  name: string;
  description: string;
  aql: string;
  parameters?: string[];
}

export const AQL_RECIPES: AQLRecipe[] = [
  {
    name: 'Find Contradictions',
    description: 'Find all contradictory relationships in the graph',
    aql: `
      FOR edge IN edges
        FILTER edge.type == "contradicts"
        FOR from IN nodes
          FILTER from._id == edge._from
          FOR to IN nodes
            FILTER to._id == edge._to
            RETURN {
              from: from,
              to: to,
              edge: edge
            }
    `,
  },
  {
    name: 'Downstream Impact Analysis',
    description: 'Find all nodes that depend on a specific node (cascading dependencies)',
    aql: `
      FOR v, e, p IN 1..{{depth}} OUTBOUND "{{startNode}}" GRAPH "datalake"
        FILTER e.type == "depends_on"
        RETURN DISTINCT v
    `,
    parameters: ['startNode', 'depth'],
  },
  {
    name: 'BM25 Text Search',
    description: 'Search nodes using BM25 full-text search',
    aql: `
      FOR node IN FULLTEXT(nodes, "content,title", "{{searchTerm}}")
        SORT BM25(node) DESC
        LIMIT {{limit}}
        RETURN node
    `,
    parameters: ['searchTerm', 'limit'],
  },
  {
    name: 'Multi-hop Dependency Chain',
    description: 'Find dependency chains from one node to another',
    aql: `
      FOR v, e, p IN 1..{{maxDepth}} OUTBOUND "{{fromNode}}" GRAPH "datalake"
        FILTER e.type == "depends_on"
        FILTER v._id == "{{toNode}}"
        RETURN p
    `,
    parameters: ['fromNode', 'toNode', 'maxDepth'],
  },
  {
    name: 'Refinement Hierarchy',
    description: 'Build refinement hierarchy starting from a root node',
    aql: `
      FOR v, e, p IN 1..{{depth}} OUTBOUND "{{rootNode}}" GRAPH "datalake"
        FILTER e.type == "refines"
        RETURN {
          node: v,
          path: p,
          depth: LENGTH(p.edges)
        }
    `,
    parameters: ['rootNode', 'depth'],
  },
  {
    name: 'KNN Similarity Network',
    description: 'Find similarity neighborhoods using KNN edges',
    aql: `
      FOR v, e, p IN 1..2 ANY "{{centerNode}}" GRAPH "datalake"
        FILTER e.type == "knn"
        SORT e.weight DESC
        LIMIT {{k}}
        RETURN {
          node: v,
          similarity: e.weight
        }
    `,
    parameters: ['centerNode', 'k'],
  }
];

export function fillAQLTemplate(recipe: AQLRecipe, parameters: Record<string, any>): string {
  let filledAQL = recipe.aql;
  
  if (recipe.parameters) {
    recipe.parameters.forEach(param => {
      const value = parameters[param];
      if (value !== undefined) {
        filledAQL = filledAQL.replace(new RegExp(`{{${param}}}`, 'g'), value);
      }
    });
  }
  
  return filledAQL;
}