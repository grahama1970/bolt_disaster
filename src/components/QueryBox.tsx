import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Book, Code, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useGraphStore } from '../state/store';
import { AQL_RECIPES, fillAQLTemplate } from '../lib/query/aql-recipes';

export function QueryBox() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { updateFilters, centerOnNode } = useGraphStore();

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    
    try {
      // Simple LLM command mapping
      const result = await processLLMCommand(query);
      
      if (result.type === 'search') {
        updateFilters({ search: result.value });
      } else if (result.type === 'center') {
        centerOnNode(result.value);
      } else if (result.type === 'filter') {
        updateFilters(result.value);
      }
      
      setQuery('');
    } catch (error) {
      console.error('Query processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecipeSelect = (recipe: typeof AQL_RECIPES[0]) => {
    // In a real implementation, this would show a parameter input dialog
    // and then execute the AQL query
    console.log('Selected recipe:', recipe.name);
    
    // For demo purposes, we'll set it as the query
    setQuery(`-- ${recipe.name}\n${recipe.description}\n\n${recipe.aql}`);
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-16 left-1/2 transform -translate-x-1/2 w-96 z-20"
    >
      <motion.div
        animate={{ height: isExpanded ? 200 : 60 }}
        className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              <Sparkles className="h-4 w-4 ml-1" />
            </Button>
            <span className="text-sm font-medium">LLM Query Interface</span>
            
            <div className="flex gap-1 ml-auto">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Book className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>AQL Recipes</DialogTitle>
                    <DialogDescription>
                      Pre-built queries for common graph analysis tasks
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {AQL_RECIPES.map((recipe) => (
                      <motion.div
                        key={recipe.name}
                        whileHover={{ scale: 1.02 }}
                        className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                        onClick={() => handleRecipeSelect(recipe)}
                      >
                        <h4 className="font-medium">{recipe.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {recipe.description}
                        </p>
                        {recipe.parameters && (
                          <div className="flex gap-1 flex-wrap">
                            {recipe.parameters.map((param) => (
                              <span
                                key={param}
                                className="px-2 py-1 bg-muted text-xs rounded"
                              >
                                {param}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about the graph... (e.g., 'Find all contradictions in section S87', 'Show dependencies of theorem T42')"
                  className="resize-none text-sm"
                  rows={4}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Natural language or AQL queries supported
                  </span>
                  <Button
                    size="sm"
                    onClick={handleSubmitQuery}
                    disabled={!query.trim() || isProcessing}
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about the graph..."
                className="flex-1 bg-transparent border-0 outline-none text-sm"
                onFocus={() => setIsExpanded(true)}
              />
              <Button
                size="sm"
                onClick={handleSubmitQuery}
                disabled={!query.trim() || isProcessing}
              >
                {isProcessing ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-current" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Simple LLM command processor (stub implementation)
async function processLLMCommand(query: string): Promise<{
  type: 'search' | 'center' | 'filter' | 'unknown';
  value: any;
}> {
  const lowerQuery = query.toLowerCase();

  // Simple pattern matching - in a real implementation, this would
  // use an actual LLM API or more sophisticated NLP
  
  if (lowerQuery.includes('find') && lowerQuery.includes('contradiction')) {
    return { type: 'filter', value: { enabledEdgeTypes: new Set(['contradicts']) } };
  }
  
  if (lowerQuery.includes('show') && lowerQuery.includes('dependencies')) {
    return { type: 'filter', value: { enabledEdgeTypes: new Set(['depends_on']) } };
  }
  
  if (lowerQuery.includes('search for') || lowerQuery.includes('find')) {
    // Extract search term after "search for" or "find"
    const match = lowerQuery.match(/(?:search for|find)\s+(.+)/);
    if (match) {
      return { type: 'search', value: match[1] };
    }
  }
  
  if (lowerQuery.includes('center on') || lowerQuery.includes('focus on')) {
    // Extract node identifier
    const match = lowerQuery.match(/(?:center on|focus on)\s+(.+)/);
    if (match) {
      return { type: 'center', value: match[1] };
    }
  }
  
  // Default: treat as search
  return { type: 'search', value: query };
}