import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Network, Filter, Layers } from 'lucide-react';
import { useGraphStore } from '../state/store';

export function StatsBar() {
  const { nodes, edges, filters, stats } = useGraphStore();

  // Calculate degree distribution
  const degreeDistribution = useMemo(() => {
    const degrees = new Map<string, number>();
    
    edges.forEach(edge => {
      degrees.set(edge._from, (degrees.get(edge._from) || 0) + 1);
      degrees.set(edge._to, (degrees.get(edge._to) || 0) + 1);
    });

    const distribution = Array.from(degrees.values());
    const max = Math.max(...distribution, 1);
    const buckets = 10;
    const bucketSize = Math.ceil(max / buckets);
    const histogram = new Array(buckets).fill(0);

    distribution.forEach(degree => {
      const bucket = Math.min(Math.floor(degree / bucketSize), buckets - 1);
      histogram[bucket]++;
    });

    return {
      histogram,
      max,
      avg: distribution.length > 0 ? distribution.reduce((a, b) => a + b, 0) / distribution.length : 0,
    };
  }, [edges]);

  // Filter active nodes and edges
  const activeNodes = useMemo(() => {
    return nodes.filter(node => {
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
  }, [nodes, filters]);

  const activeEdges = useMemo(() => {
    const nodeIds = new Set(activeNodes.map(n => n._id));
    return edges.filter(edge => 
      nodeIds.has(edge._from) && 
      nodeIds.has(edge._to) &&
      filters.enabledEdgeTypes.has(edge.type)
    );
  }, [edges, activeNodes, filters.enabledEdgeTypes]);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-sm border-t flex items-center justify-between px-4 text-sm"
    >
      <div className="flex items-center gap-6">
        {/* Node/Edge Counts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Network className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{activeNodes.length}</span>
            <span className="text-muted-foreground">/ {stats.totalNodes} nodes</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{activeEdges.length}</span>
            <span className="text-muted-foreground">/ {stats.totalEdges} edges</span>
          </div>
        </div>

        {/* Active Filters */}
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{stats.activeFilters}</span>
          <span className="text-muted-foreground">filters</span>
        </div>

        {/* Traversal Depth */}
        <div className="flex items-center gap-1">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">depth</span>
          <span className="font-medium">{filters.traversalDepth}</span>
        </div>

        {/* Connected Components */}
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">components</span>
          <span className="font-medium">{stats.connectedComponents}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Degree Distribution Mini Histogram */}
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-end gap-px h-6">
            {degreeDistribution.histogram.map((count, i) => (
              <div
                key={i}
                className="bg-primary/60 w-2"
                style={{
                  height: `${Math.max(2, (count / Math.max(...degreeDistribution.histogram)) * 20)}px`
                }}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            avg: {degreeDistribution.avg.toFixed(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}