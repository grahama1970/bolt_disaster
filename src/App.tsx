import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toolbar } from './components/Toolbar';
import { Inspector } from './components/Inspector';
import { SigmaGraph } from './components/SigmaGraph';
import { ForceGraph } from './components/ForceGraph';
import { Legend } from './components/Legend';
import { StatsBar } from './components/StatsBar';
import { QueryBox } from './components/QueryBox';
import { TooltipProvider } from './components/ui/tooltip';
import { useGraphStore } from './state/store';
import { normalizePortableGraph } from './lib/normalizers/portable';
import { normalizeDbNativeGraph, detectGraphFormat } from './lib/normalizers/db-native';
import { decodeStateFromUrl } from './lib/deeplink';
import { GraphData } from './types/graph';

function GraphViewer() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  const {
    renderer,
    theme,
    inspectorOpen,
    setGraphData,
    updateFilters,
    setFocusedNode,
    setSelectedNodes,
    setRenderer,
    setTheme,
    updateStats,
  } = useGraphStore();

  // Load graph data
  useEffect(() => {
    const loadGraphData = async () => {
      try {
        // Check for data parameter in URL
        const dataPath = searchParams.get('data');
        let dataUrl = '/graph.mid.json'; // default dataset
        
        if (dataPath && dataPath.startsWith('/')) {
          dataUrl = dataPath;
        }

        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Failed to load graph data: ${response.statusText}`);
        }
        
        const rawData = await response.json();
        const format = detectGraphFormat(rawData);
        
        let normalizedData: GraphData;
        
        if (format === 'portable') {
          normalizedData = normalizePortableGraph(rawData);
        } else if (format === 'db-native') {
          normalizedData = normalizeDbNativeGraph(rawData);
        } else {
          throw new Error('Unknown graph data format');
        }
        
        setGraphData(normalizedData);
        updateStats();
        
        console.log(`Loaded ${normalizedData.nodes.length} nodes and ${normalizedData.edges.length} edges`);
      } catch (error) {
        console.error('Failed to load graph data:', error);
        // Load a small demo dataset as fallback
        const demoData: GraphData = {
          nodes: [
            { _id: 'sections/s1', _key: 's1', label: 'Introduction', type: 'section', title: 'Introduction' },
            { _id: 'lemmas/l1', _key: 'l1', label: 'Basic Lemma', type: 'lemma', title: 'Basic Lemma' },
            { _id: 'theorems/t1', _key: 't1', label: 'Main Theorem', type: 'theorem', title: 'Main Theorem' },
          ],
          edges: [
            { _id: 'e1', _from: 'sections/s1', _to: 'lemmas/l1', type: 'depends_on' },
            { _id: 'e2', _from: 'lemmas/l1', _to: 'theorems/t1', type: 'refines' },
          ],
        };
        setGraphData(demoData);
        updateStats();
      } finally {
        setIsLoading(false);
      }
    };

    loadGraphData();
  }, [searchParams, setGraphData, updateStats]);

  // Apply deep link state
  useEffect(() => {
    const deepLinkState = decodeStateFromUrl();
    
    if (deepLinkState.focus) {
      setFocusedNode(deepLinkState.focus);
    }
    
    if (deepLinkState.selection) {
      setSelectedNodes(new Set(deepLinkState.selection));
    }
    
    if (deepLinkState.edges) {
      updateFilters({ enabledEdgeTypes: new Set(deepLinkState.edges) });
    }
    
    if (deepLinkState.depth) {
      updateFilters({ traversalDepth: deepLinkState.depth });
    }
    
    if (deepLinkState.neighbors !== undefined) {
      updateFilters({ includeNeighbors: deepLinkState.neighbors });
    }
    
    if (deepLinkState.search) {
      updateFilters({ search: deepLinkState.search });
    }
    
    if (deepLinkState.exact !== undefined) {
      updateFilters({ exactMatch: deepLinkState.exact });
    }
    
    if (deepLinkState.renderer) {
      setRenderer(deepLinkState.renderer);
    }
    
    if (deepLinkState.theme) {
      setTheme(deepLinkState.theme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark', 'high-contrast');
    root.classList.add(theme);
    
    if (theme === 'high-contrast') {
      root.style.setProperty('--background', '255 255 255');
      root.style.setProperty('--foreground', '0 0 0');
      root.style.setProperty('--card', '255 255 255');
      root.style.setProperty('--card-foreground', '0 0 0');
      root.style.setProperty('--popover', '255 255 255');
      root.style.setProperty('--popover-foreground', '0 0 0');
      root.style.setProperty('--primary', '0 0 0');
      root.style.setProperty('--primary-foreground', '255 255 255');
      root.style.setProperty('--secondary', '240 240 240');
      root.style.setProperty('--secondary-foreground', '0 0 0');
      root.style.setProperty('--muted', '240 240 240');
      root.style.setProperty('--muted-foreground', '100 100 100');
      root.style.setProperty('--accent', '240 240 240');
      root.style.setProperty('--accent-foreground', '0 0 0');
      root.style.setProperty('--destructive', '200 0 0');
      root.style.setProperty('--destructive-foreground', '255 255 255');
      root.style.setProperty('--border', '200 200 200');
      root.style.setProperty('--input', '200 200 200');
      root.style.setProperty('--ring', '0 0 0');
    }
  }, [theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Lean4 Graph Data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Toolbar />
        
        <div className="relative">
          {/* Graph Canvas */}
          <div className="h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] w-full">
            <AnimatePresence mode="wait">
              {renderer === 'sigma' ? (
                <SigmaGraph key="sigma" />
              ) : (
                <ForceGraph key="d3" />
              )}
            </AnimatePresence>
          </div>
          
          {/* Inspector Panel */}
          <AnimatePresence>
            <Inspector />
          </AnimatePresence>
          
          {/* Legend */}
          <Legend />
          
          {/* Query Interface */}
          <QueryBox />
        </div>
        
        {/* Stats Bar */}
        <StatsBar />
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<GraphViewer />} />
        <Route path="/viewer" element={<GraphViewer />} />
      </Routes>
    </Router>
  );
}

export default App;