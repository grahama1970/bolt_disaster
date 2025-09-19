import React from 'react';
import { motion } from 'framer-motion';
import { Info, FileText, GitBranch, Zap, ArrowRight } from 'lucide-react';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Button } from './ui/button';
import { useGraphStore } from '../state/store';

export function Legend() {
  const { theme, filters } = useGraphStore();

  const nodeTypes = [
    { type: 'section', label: 'Sections', icon: FileText, color: 'text-sky-500' },
    { type: 'lemma', label: 'Lemmas', icon: GitBranch, color: 'text-violet-500' },
    { type: 'theorem', label: 'Theorems', icon: Zap, color: 'text-green-500' },
  ];

  const edgeTypes = [
    { type: 'depends_on', label: 'Dependencies', color: 'border-green-500' },
    { type: 'contradicts', label: 'Contradictions', color: 'border-red-500' },
    { type: 'refines', label: 'Refinements', color: 'border-indigo-500' },
    { type: 'knn', label: 'Similarity', color: 'border-neutral-400' },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-10">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <h3 className="font-medium mb-3">Node Types</h3>
              <div className="space-y-2">
                {nodeTypes.map(({ type, label, icon: Icon, color }) => (
                  <div key={type} className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Edge Types</h3>
              <div className="space-y-2">
                {edgeTypes.map(({ type, label, color }) => (
                  <div key={type} className="flex items-center gap-2">
                    <div className={`w-4 h-0 border-t-2 ${color}`} />
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{label}</span>
                    {!filters.enabledEdgeTypes.has(type) && (
                      <span className="text-xs text-muted-foreground">(hidden)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Use keyboard shortcuts:</p>
              <p>• WASD or arrows to pan</p>
              <p>• +/- to zoom</p>
              <p>• ⌘K to search</p>
              <p>• Tab to navigate nodes</p>
            </div>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}