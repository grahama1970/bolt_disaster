import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { useGraphStore } from '../state/store';

export function ForceGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
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
  } = useGraphStore();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    // Filter data based on current filters
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

    if (filteredNodes.length === 0) return;

    // Create simulation
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredEdges).id((d: any) => d._id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(20));

    // Create container groups
    const container = svg.append('g');
    const edgeGroup = container.append('g').attr('class', 'edges');
    const nodeGroup = container.append('g').attr('class', 'nodes');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create edges
    const edgeSelection = edgeGroup.selectAll('line')
      .data(filteredEdges)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => getEdgeColor(d.type, theme))
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6);

    // Create nodes
    const nodeSelection = nodeGroup.selectAll('circle')
      .data(filteredNodes)
      .enter()
      .append('circle')
      .attr('r', (d: any) => selectedNodes.has(d._id) ? 8 : 5)
      .attr('fill', (d: any) => getNodeColor(d.type, theme))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        setHoveredNode(d._id);
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', 10)
          .attr('stroke-width', 3);
      })
      .on('mouseout', function() {
        setHoveredNode(null);
        d3.select(this)
          .transition()
          .duration(100)
          .attr('r', (d: any) => selectedNodes.has(d._id) ? 8 : 5)
          .attr('stroke-width', 2);
      })
      .on('click', function(event, d: any) {
        centerOnNode(d._id);
      })
      .call(d3.drag<SVGCircleElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // Add labels
    const labelSelection = nodeGroup.selectAll('text')
      .data(filteredNodes)
      .enter()
      .append('text')
      .text((d: any) => d.label || d.title || d._key)
      .attr('font-size', 10)
      .attr('text-anchor', 'middle')
      .attr('dy', 4)
      .attr('pointer-events', 'none')
      .attr('fill', theme === 'dark' ? '#ffffff' : '#000000');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      edgeSelection
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeSelection
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labelSelection
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // Focus on selected node
    if (focusedNode) {
      const node = filteredNodes.find(n => n._id === focusedNode);
      if (node && 'x' in node && 'y' in node) {
        const transform = d3.zoomIdentity
          .translate(width / 2 - (node as any).x, height / 2 - (node as any).y)
          .scale(1.5);
        
        svg.transition()
          .duration(300)
          .call(zoom.transform, transform);
      }
    }

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, filters, selectedNodes, focusedNode, theme, setHoveredNode, centerOnNode]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      const panStep = 50;
      const zoomStep = 0.2;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().translateBy as any,
            0, panStep
          );
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().translateBy as any,
            0, -panStep
          );
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().translateBy as any,
            panStep, 0
          );
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().translateBy as any,
            -panStep, 0
          );
          break;
        case '+':
        case '=':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
            1 + zoomStep
          );
          break;
        case '-':
          e.preventDefault();
          svg.transition().duration(200).call(
            d3.zoom<SVGSVGElement, unknown>().scaleBy as any,
            1 - zoomStep
          );
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
      className="w-full h-full"
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="bg-background"
        role="application"
        aria-label="Interactive force-directed graph visualization"
      />
      
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