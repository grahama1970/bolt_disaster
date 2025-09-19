import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GraphNode, GraphEdge, GraphData, CameraState, Annotation } from '../types/graph';

export interface GraphFilters {
  search: string;
  exactMatch: boolean;
  includeNeighbors: boolean;
  enabledEdgeTypes: Set<string>;
  traversalDepth: number;
}

export interface GraphState {
  // Graph data
  nodes: GraphNode[];
  edges: GraphEdge[];
  
  // Selection and focus
  selectedNodes: Set<string>;
  focusedNode: string | null;
  hoveredNode: string | null;
  
  // Filters and search
  filters: GraphFilters;
  searchResults: GraphNode[];
  
  // UI state
  renderer: 'sigma' | 'd3';
  theme: 'light' | 'dark' | 'high-contrast';
  inspectorOpen: boolean;
  commandPaletteOpen: boolean;
  
  // Camera
  camera: CameraState;
  
  // Analytics
  stats: {
    totalNodes: number;
    totalEdges: number;
    activeFilters: number;
    connectedComponents: number;
  };
  
  // Annotations
  annotations: Map<string, Annotation>;
  
  // Actions
  setGraphData: (data: GraphData) => void;
  setSelectedNodes: (nodes: Set<string>) => void;
  setFocusedNode: (nodeId: string | null) => void;
  setHoveredNode: (nodeId: string | null) => void;
  updateFilters: (filters: Partial<GraphFilters>) => void;
  setSearchResults: (results: GraphNode[]) => void;
  setRenderer: (renderer: 'sigma' | 'd3') => void;
  setTheme: (theme: 'light' | 'dark' | 'high-contrast') => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateCamera: (camera: Partial<CameraState>) => void;
  updateStats: () => void;
  addAnnotation: (annotation: Annotation) => void;
  removeAnnotation: (nodeId: string, annotationId: string) => void;
  centerOnNode: (nodeId: string) => void;
  exportState: () => string;
  importState: (state: string) => void;
}

const defaultFilters: GraphFilters = {
  search: '',
  exactMatch: false,
  includeNeighbors: false,
  enabledEdgeTypes: new Set(['depends_on', 'contradicts', 'refines', 'knn']),
  traversalDepth: 2,
};

const defaultCamera: CameraState = {
  x: 0.5,
  y: 0.5,
  ratio: 1,
};

export const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      // Initial state
      nodes: [],
      edges: [],
      selectedNodes: new Set(),
      focusedNode: null,
      hoveredNode: null,
      filters: defaultFilters,
      searchResults: [],
      renderer: 'sigma',
      theme: 'light',
      inspectorOpen: false,
      commandPaletteOpen: false,
      camera: defaultCamera,
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        activeFilters: 0,
        connectedComponents: 0,
      },
      annotations: new Map(),

      // Actions
      setGraphData: (data: GraphData) => set((state) => {
        const newState = {
          ...state,
          nodes: data.nodes,
          edges: data.edges,
        };
        // Update stats
        const updatedState = {
          ...newState,
          stats: {
            ...newState.stats,
            totalNodes: data.nodes.length,
            totalEdges: data.edges.length,
          },
        };
        return updatedState;
      }),

      setSelectedNodes: (nodes: Set<string>) => set({ selectedNodes: nodes }),

      setFocusedNode: (nodeId: string | null) => set({ focusedNode: nodeId }),

      setHoveredNode: (nodeId: string | null) => set({ hoveredNode: nodeId }),

      updateFilters: (newFilters: Partial<GraphFilters>) => set((state) => {
        const updatedFilters = { ...state.filters, ...newFilters };
        const activeFilters = 
          (updatedFilters.search ? 1 : 0) +
          (updatedFilters.includeNeighbors ? 1 : 0) +
          (updatedFilters.enabledEdgeTypes.size < 4 ? 1 : 0) +
          (updatedFilters.traversalDepth !== 2 ? 1 : 0);
        
        return {
          filters: updatedFilters,
          stats: {
            ...state.stats,
            activeFilters,
          },
        };
      }),

      setSearchResults: (results: GraphNode[]) => set({ searchResults: results }),

      setRenderer: (renderer: 'sigma' | 'd3') => set({ renderer }),

      setTheme: (theme: 'light' | 'dark' | 'high-contrast') => set({ theme }),

      setInspectorOpen: (open: boolean) => set({ inspectorOpen: open }),

      setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),

      updateCamera: (camera: Partial<CameraState>) => set((state) => ({
        camera: { ...state.camera, ...camera },
      })),

      updateStats: () => set((state) => {
        // Calculate connected components
        const visited = new Set<string>();
        let components = 0;
        
        const dfs = (nodeId: string) => {
          if (visited.has(nodeId)) return;
          visited.add(nodeId);
          
          state.edges
            .filter(edge => edge._from === nodeId || edge._to === nodeId)
            .forEach(edge => {
              const connectedNode = edge._from === nodeId ? edge._to : edge._from;
              if (!visited.has(connectedNode)) {
                dfs(connectedNode);
              }
            });
        };

        state.nodes.forEach(node => {
          if (!visited.has(node._id)) {
            components++;
            dfs(node._id);
          }
        });

        return {
          stats: {
            ...state.stats,
            connectedComponents: components,
          },
        };
      }),

      addAnnotation: (annotation: Annotation) => set((state) => {
        const newAnnotations = new Map(state.annotations);
        const nodeAnnotations = newAnnotations.get(annotation.nodeId) || [];
        newAnnotations.set(annotation.nodeId, [...nodeAnnotations, annotation]);
        return { annotations: newAnnotations };
      }),

      removeAnnotation: (nodeId: string, annotationId: string) => set((state) => {
        const newAnnotations = new Map(state.annotations);
        const nodeAnnotations = newAnnotations.get(nodeId) || [];
        newAnnotations.set(
          nodeId,
          nodeAnnotations.filter(ann => ann.id !== annotationId)
        );
        return { annotations: newAnnotations };
      }),

      centerOnNode: (nodeId: string) => set((state) => ({
        focusedNode: nodeId,
        selectedNodes: new Set([nodeId]),
        inspectorOpen: true,
      })),

      exportState: () => {
        const state = get();
        return JSON.stringify({
          filters: state.filters,
          selectedNodes: Array.from(state.selectedNodes),
          focusedNode: state.focusedNode,
          camera: state.camera,
          renderer: state.renderer,
          theme: state.theme,
          annotations: Object.fromEntries(state.annotations),
        });
      },

      importState: (stateString: string) => {
        try {
          const importedState = JSON.parse(stateString);
          set((state) => ({
            ...state,
            filters: importedState.filters || state.filters,
            selectedNodes: new Set(importedState.selectedNodes || []),
            focusedNode: importedState.focusedNode,
            camera: importedState.camera || state.camera,
            renderer: importedState.renderer || state.renderer,
            theme: importedState.theme || state.theme,
            annotations: new Map(Object.entries(importedState.annotations || {})),
          }));
        } catch (error) {
          console.error('Failed to import state:', error);
        }
      },
    }),
    {
      name: 'lean4-graph-viewer-storage',
      partialize: (state) => ({
        filters: state.filters,
        renderer: state.renderer,
        theme: state.theme,
        camera: state.camera,
        annotations: Object.fromEntries(state.annotations),
      }),
    }
  )
);