# Lean4 Datalake Graph Viewer

A sophisticated, production-ready graph visualization application built for exploring Lean4 proving pipelines and formal verification workflows. The viewer enables scientists and engineers to discover contradictions, trace dependencies, and analyze complex relationships across document datalakes.

## Features

### Core Visualization
- **Dual Rendering**: High-performance WebGL rendering via Sigma.js with D3.js SVG fallback
- **Interactive Navigation**: Smooth pan/zoom with 250-350ms eased camera animations
- **Advanced Filtering**: Multi-dimensional filters with fuzzy search, exact matching, and traversal depth control
- **Real-time Analytics**: Live statistics with degree distribution histograms and connected component analysis

### Query & Search
- **Fuzzy Search**: Powered by Fuse.js across node titles, keys, and document IDs
- **AQL Integration**: Pre-built recipes for common graph analysis patterns
- **LLM Interface**: Natural language query processing with command mapping
- **Multi-hop Traversal**: Configurable depth traversal with BM25 fusion for ranked results

### Accessibility & UX
- **Full Keyboard Support**: WASD/arrow navigation, Tab-based node selection, +/- zoom controls
- **Screen Reader Compatible**: ARIA labels, role definitions, and state announcements
- **High Contrast Mode**: WCAG AA compliant color scheme for enhanced accessibility
- **Responsive Design**: Optimized layouts for desktop, tablet, and mobile viewports

### Collaboration & Persistence
- **Deep Linking**: URL-encoded view state for sharing specific graph configurations
- **Session Management**: Automatic save/restore of filters, selections, and camera position
- **Export Capabilities**: PNG/SVG image export and CSV/JSON data export
- **Local Annotations**: Non-destructive note-taking and tagging system

### Advanced Features
- **Contradiction Detection**: Automated identification of conflicting dependencies
- **Cascading Impact Analysis**: Trace downstream effects of changes or errors
- **Similarity Networks**: KNN-based relationship discovery
- **Performance Optimized**: Handles 2-5k nodes with GPU-accelerated rendering

## Data Formats

### Portable JSON (CI-Friendly)
```json
{
  "nodes": {
    "sections": [{"id": "S1", "title": "Introduction", "type": "section"}],
    "lemmas": [{"id": "L1", "title": "Basic Lemma", "type": "lemma"}]
  },
  "edges": {
    "depends_on": [{"from": "S1", "to": "L1", "type": "depends_on", "weight": 0.8}]
  }
}
```

### Database-Native JSON (ArangoDB Style)
```json
{
  "nodes": [
    {"_id": "sections/S1", "_key": "S1", "label": "Introduction", "type": "section"}
  ],
  "edges": [
    {"_id": "e1", "_from": "sections/S1", "_to": "lemmas/L1", "type": "depends_on"}
  ]
}
```

## Installation & Usage

### Development
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Testing
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| `⌘/Ctrl + K` | Open command palette |
| `W/A/S/D` or `↑/↓/←/→` | Pan camera |
| `+/-` | Zoom in/out |
| `Tab/Shift+Tab` | Navigate nodes |
| `Enter` | Select focused node |
| `Escape` | Close dialogs/panels |

## URL Parameters for Deep Linking

- `focus` - Node ID to center on
- `selection` - Comma-separated list of selected node IDs
- `edges` - Enabled edge types (depends_on,contradicts,refines,knn)
- `depth` - Traversal depth (1-5)
- `neighbors` - Include neighbors in results (true/false)
- `search` - Search query string
- `exact` - Exact match mode (true/false)
- `renderer` - Rendering engine (sigma/d3)
- `theme` - UI theme (light/dark/high-contrast)

Example: `/?focus=sections/S87&edges=depends_on,refines&depth=3&neighbors=1`

## Export Options

### Image Export
- **PNG**: High-resolution (2x scale) with transparency support
- **SVG**: Vector graphics for print-quality output

### Data Export
- **CSV**: Selected nodes with metadata in tabular format
- **JSON**: Complete node data with timestamps and selection context

## Graph Metrics

The viewer provides real-time analytics:

- **Node/Edge Counts**: Total and filtered counts
- **Active Filters**: Number of applied filters
- **Connected Components**: Graph connectivity analysis
- **Degree Distribution**: Mini histogram of node connectivity

## Color Coding

### Node Types
- **Sections**: Sky Blue (`#0ea5e9`)
- **Lemmas**: Violet (`#8b5cf6`)
- **Theorems**: Green (`#10b981`)

### Edge Types
- **Dependencies**: Green (`#10b981`)
- **Contradictions**: Red (`#ef4444`)
- **Refinements**: Indigo (`#6366f1`)
- **Similarity (KNN)**: Neutral (`#9ca3af`)

## AQL Recipe Library

Pre-built queries for common analysis tasks:

1. **Find Contradictions** - Identify conflicting relationships
2. **Downstream Impact Analysis** - Trace cascading dependencies
3. **BM25 Text Search** - Full-text search with relevance ranking
4. **Multi-hop Dependency Chain** - Path finding between nodes
5. **Refinement Hierarchy** - Build hierarchical refinement trees
6. **KNN Similarity Network** - Discover related content clusters

## Performance Considerations

- **GPU Acceleration**: WebGL rendering with hardware acceleration
- **Virtualization**: Large lists use virtual scrolling
- **Debounced Search**: 300ms delay to prevent excessive queries
- **Efficient Updates**: React.memo and selective re-rendering
- **Memory Management**: Proper cleanup of event listeners and references

## Browser Support

- **Chrome/Edge**: Full WebGL and modern feature support
- **Firefox**: Complete compatibility with all features
- **Safari**: WebGL and advanced CSS features supported
- **Mobile**: Responsive design with touch gesture support

## Technical Architecture

- **Frontend**: React 18+ with TypeScript
- **State Management**: Zustand with persistence middleware  
- **Styling**: Tailwind CSS with ShadCN/ui components
- **Animations**: Framer Motion with GPU optimization
- **Graph Rendering**: Sigma.js (WebGL) + D3.js (SVG fallback)
- **Search**: Fuse.js with configurable fuzzy matching
- **Build System**: Vite with optimized production builds

## Contributing

This project follows modern React development patterns with comprehensive TypeScript typing, extensive testing coverage, and accessibility-first design principles. The modular architecture enables easy extension and customization for specific use cases.

## License

MIT License - see LICENSE file for details.