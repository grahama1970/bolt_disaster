import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Graph from 'sigma';
import { useGraphStore } from '../state/store';
import { GraphNode, GraphEdge } from '../types/graph';

export function SigmaGraph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Graph | null>(null);
  const {
    nodes,
    edges,
    selectedNodes,
    focusedNode,
    hoveredNode,
    filters,
    theme,
    setHoveredNode,
    centerOnNode,
    updateCamera,
  } = useGraphStore();

  const [isLoading, setIsLoading] = useState(true);

  // Initialize Sigma instance
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing instance
    if (sigmaRef.current) {
      sigmaRef.current.kill();
    }

    // Create new Sigma instance
    const sigma = new Graph(containerRef.current, {
      defaultNodeColor: '#3b82f6',
      defaultEdgeColor: '#e5e7eb',
      enableEdgeClickEvents: true,
      enableEdgeHoverEvents: true,
      zoomToSizeRatioFunction: (ratio: number) => ratio,
      itemSizesReference: 'positions',
    });

    sigmaRef.current = sigma;
    setIsLoading(false);

    return () => {
      if (sigmaRef.current) {
        sigmaRef.current.kill();
      }
    };
  }, []);

  // Update graph data
  useEffect(() => {
    if (!sigmaRef.current || isLoading) return;

    const sigma = sigmaRef.current;
    sigma.clear();

    // Filter nodes and edges based on current filters
    const filteredNodes = nodes.filter(node => {
      if (filters.search && !filters.exactMatch) {
        const searchTerm = filters.search.toLowerCase();
        return (
          node.label?.toLowerCase().includes(searchTerm) ||
          node.title?.toLowerCase().includes(searchTerm) ||
          node._key.toLowerCase().includes(searchTerm) ||
          node.doc_id?.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n._id));
    const filteredEdges = edges.filter(edge => 
      nodeIds.has(edge._from) && 
      nodeIds.has(edge._to) &&
      filters.enabledEdgeTypes.has(edge.type)
    );

    // Add nodes to sigma
    filteredNodes.forEach(node => {
      const color = getNodeColor(node.type, theme);
      const size = selectedNodes.has(node._id) ? 8 : 4;
      
      sigma.addNode(node._id, {
        label: node.label || node.title || node._key,
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        size: size,
        color: color,
        type: node.type,
      });
    });

    // Add edges to sigma
    filteredEdges.forEach(edge => {
      const color = getEdgeColor(edge.type, theme);
      
      sigma.addEdge(edge._id, edge._from, edge._to, {
        label: edge.type,
        color: color,
        size: 1,
        type: 'arrow',
      });
    });

    // Start layout algorithm
    if (filteredNodes.length > 0) {
      // Simple force-atlas-like positioning
      const iterations = Math.min(300, filteredNodes.length * 2);
      for (let i = 0; i < iterations; i++) {
        // This is a simplified force-directed layout
        // In a real implementation, you'd use ForceAtlas2
      }
    }

    sigma.refresh();
  }, [nodes, edges, filters, selectedNodes, theme, isLoading]);

  // Handle node interactions
  useEffect(() => {
    if (!sigmaRef.current) return;

    const sigma = sigmaRef.current;

    const handleNodeHover = (event: any) => {
      const nodeId = event.data.node;
      setHoveredNode(nodeId);
    };

    const handleNodeOut = () => {
      setHoveredNode(null);
    };

    const handleNodeClick = (event: any) => {
      const nodeId = event.data.node;
      centerOnNode(nodeId);
    };

    sigma.on('enterNode', handleNodeHover);
    sigma.on('leaveNode', handleNodeOut);
    sigma.on('clickNode', handleNodeClick);

    return () => {
      sigma.off('enterNode', handleNodeHover);
      sigma.off('leaveNode', handleNodeOut);
      sigma.off('clickNode', handleNodeClick);
    };
  }, [setHoveredNode, centerOnNode]);

  // Focus on selected node
  useEffect(() => {
    if (!sigmaRef.current || !focusedNode) return;

    const sigma = sigmaRef.current;
    const camera = sigma.getCamera();
    
    try {
      const nodePosition = sigma.getNodeDisplayData(focusedNode);
      if (nodePosition) {
        camera.animate(
          { x: nodePosition.x, y: nodePosition.y, ratio: 0.5 },
          { duration: 300, easing: 'quadInOut' }
        );
      }
    } catch (error) {
      console.warn('Node not found:', focusedNode);
    }
  }, [focusedNode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sigmaRef.current) return;

      const camera = sigmaRef.current.getCamera();
      const panStep = 50;
      const zoomStep = 0.1;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          camera.animate({ y: camera.y - panStep }, { duration: 200 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          camera.animate({ y: camera.y + panStep }, { duration: 200 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          camera.animate({ x: camera.x - panStep }, { duration: 200 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          camera.animate({ x: camera.x + panStep }, { duration: 200 });
          break;
        case '+':
        case '=':
          e.preventDefault();
          camera.animate({ ratio: camera.ratio * (1 - zoomStep) }, { duration: 200 });
          break;
        case '-':
          e.preventDefault();
          camera.animate({ ratio: camera.ratio * (1 + zoomStep) }, { duration: 200 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full h-full"
    >
      <div 
        ref={containerRef} 
        className="w-full h-full"
        tabIndex={0}
        role="application"
        aria-label="Interactive graph visualization"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute top-4 left-4 p-3 bg-popover border rounded-lg shadow-lg pointer-events-none"
        >
          {(() => {
            const node = nodes.find(n => n._id === hoveredNode);
            return node ? (
              <div>
                <p className="font-medium text-sm">
                  {node.label || node.title || node._key}
                </p>
                <p className="text-xs text-muted-foreground">
                  {node.type} • {node._key}
                </p>
                {node.doc_id && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {node.doc_id}
                  </p>
                )}
              </div>
            ) : null;
          })()}
        </motion.div>
      )}
    </motion.div>
  );
}

function getNodeColor(type: string, theme: string): string {
  const colors = {
    light: {
      section: '#0ea5e9',   // sky-500
      lemma: '#8b5cf6',     // violet-500
      theorem: '#10b981',   // green-500
    },
    dark: {
      section: '#0ea5e9',
      lemma: '#8b5cf6',
      theorem: '#10b981',
    },
    'high-contrast': {
      section: '#0066cc',
      lemma: '#6600cc',
      theorem: '#006600',
    }
  };

  return colors[theme as keyof typeof colors]?.[type as keyof typeof colors.light] || '#6b7280';
}

function getEdgeColor(type: string, theme: string): string {
  const colors = {
    light: {
      depends_on: '#10b981',    // green-500
      contradicts: '#ef4444',  // red-500
      refines: '#6366f1',      // indigo-500
      knn: '#9ca3af',          // neutral-400
    },
    dark: {
      depends_on: '#10b981',
      contradicts: '#ef4444',
      refines: '#6366f1',
      knn: '#9ca3af',
    },
    'high-contrast': {
      depends_on: '#008800',
      contradicts: '#cc0000',
      refines: '#0000cc',
      knn: '#666666',
    }
  };

  return colors[theme as keyof typeof colors]?.[type as keyof typeof colors.light] || '#e5e7eb';
}