import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, Settings, Moon, Sun, Monitor, Palette } from 'lucide-react';
import { motion } from 'framer-motion';
import Fuse from 'fuse.js';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { Toggle } from './ui/toggle';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from './ui/dropdown-menu';
import { useGraphStore } from '../state/store';
import { debounce } from '../lib/utils';

export function Toolbar() {
  const {
    nodes,
    filters,
    renderer,
    theme,
    commandPaletteOpen,
    updateFilters,
    setRenderer,
    setTheme,
    setCommandPaletteOpen,
    setSearchResults,
    centerOnNode,
  } = useGraphStore();

  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [fuse, setFuse] = useState<Fuse<any> | null>(null);

  // Initialize Fuse.js for search
  useEffect(() => {
    if (nodes.length > 0) {
      const fuseInstance = new Fuse(nodes, {
        keys: ['title', '_key', 'doc_id', 'label'],
        threshold: filters.exactMatch ? 0.0 : 0.3,
        includeScore: true,
        includeMatches: true,
      });
      setFuse(fuseInstance);
    }
  }, [nodes, filters.exactMatch]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!fuse || !query.trim()) {
        setSearchResults([]);
        return;
      }

      const results = fuse.search(query);
      const searchResults = results.map(result => result.item);
      setSearchResults(searchResults);
      updateFilters({ search: query });
    }, 300),
    [fuse, setSearchResults, updateFilters]
  );

  // Handle search input changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCommandPaletteOpen]);

  const handleNodeSelect = (nodeId: string) => {
    centerOnNode(nodeId);
    setCommandPaletteOpen(false);
  };

  const edgeTypeOptions = [
    { value: 'depends_on', label: 'Dependencies', color: 'text-green-500' },
    { value: 'contradicts', label: 'Contradictions', color: 'text-red-500' },
    { value: 'refines', label: 'Refinements', color: 'text-indigo-500' },
    { value: 'knn', label: 'Similarity', color: 'text-neutral-400' },
  ];

  return (
    <>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b"
      >
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search nodes... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 text-sm bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
            />
          </div>

          {/* Exact Match Toggle */}
          <Toggle
            pressed={filters.exactMatch}
            onPressedChange={(pressed) => updateFilters({ exactMatch: pressed })}
            aria-label="Exact match"
          >
            Exact
          </Toggle>

          {/* Include Neighbors Toggle */}
          <Toggle
            pressed={filters.includeNeighbors}
            onPressedChange={(pressed) => updateFilters({ includeNeighbors: pressed })}
            aria-label="Include neighbors"
          >
            +Neighbors
          </Toggle>

          {/* Edge Type Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Edge Types ({filters.enabledEdgeTypes.size})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Edge Types</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {edgeTypeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.enabledEdgeTypes.has(option.value)}
                  onCheckedChange={(checked) => {
                    const newSet = new Set(filters.enabledEdgeTypes);
                    if (checked) {
                      newSet.add(option.value);
                    } else {
                      newSet.delete(option.value);
                    }
                    updateFilters({ enabledEdgeTypes: newSet });
                  }}
                >
                  <span className={option.color}>{option.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Traversal Depth */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Depth: {filters.traversalDepth}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Traversal Depth</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {[1, 2, 3, 4, 5].map((depth) => (
                <DropdownMenuItem
                  key={depth}
                  onClick={() => updateFilters({ traversalDepth: depth })}
                >
                  {depth} {depth === 1 ? 'hop' : 'hops'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Renderer Switch */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {renderer === 'sigma' ? 'WebGL' : 'SVG'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Renderer</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRenderer('sigma')}>
                WebGL (Sigma.js)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRenderer('d3')}>
                SVG (D3.js)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {theme === 'light' && <Sun className="h-4 w-4" />}
                {theme === 'dark' && <Moon className="h-4 w-4" />}
                {theme === 'high-contrast' && <Palette className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="h-4 w-4 mr-2" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('high-contrast')}>
                <Palette className="h-4 w-4 mr-2" />
                High Contrast
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Command Palette */}
      <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Nodes">
            {nodes.slice(0, 10).map((node) => (
              <CommandItem
                key={node._id}
                onSelect={() => handleNodeSelect(node._id)}
              >
                <div className="flex flex-col">
                  <span>{node.label || node.title || node._key}</span>
                  <span className="text-xs text-muted-foreground">
                    {node.type} • {node._id}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}