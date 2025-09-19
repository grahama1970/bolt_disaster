import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Copy, 
  ExternalLink, 
  MapPin, 
  Tag, 
  Plus, 
  X,
  ChevronRight,
  FileText,
  GitBranch,
  Zap
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useGraphStore } from '../state/store';
import { Annotation } from '../types/graph';
import { Badge } from './ui/badge';

export function Inspector() {
  const {
    nodes,
    edges,
    focusedNode,
    selectedNodes,
    inspectorOpen,
    annotations,
    setInspectorOpen,
    centerOnNode,
    addAnnotation,
    removeAnnotation,
  } = useGraphStore();

  const [newAnnotation, setNewAnnotation] = useState('');
  const [newTag, setNewTag] = useState('');

  if (!inspectorOpen) {
    return (
      <motion.button
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        onClick={() => setInspectorOpen(true)}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 bg-background border rounded-r-md shadow-lg"
      >
        <ChevronRight className="h-4 w-4" />
      </motion.button>
    );
  }

  const currentNode = focusedNode ? nodes.find(n => n._id === focusedNode) : null;

  const getNeighbors = (nodeId: string) => {
    const neighbors = {
      outgoing: [] as Array<{ node: any; edge: any }>,
      incoming: [] as Array<{ node: any; edge: any }>,
    };

    edges.forEach(edge => {
      if (edge._from === nodeId) {
        const targetNode = nodes.find(n => n._id === edge._to);
        if (targetNode) {
          neighbors.outgoing.push({ node: targetNode, edge });
        }
      } else if (edge._to === nodeId) {
        const sourceNode = nodes.find(n => n._id === edge._from);
        if (sourceNode) {
          neighbors.incoming.push({ node: sourceNode, edge });
        }
      }
    });

    return neighbors;
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
  };

  const handleCopyTitle = (title: string) => {
    navigator.clipboard.writeText(title);
  };

  const handleAddAnnotation = () => {
    if (!currentNode || !newAnnotation.trim()) return;

    const annotation: Annotation = {
      id: `ann_${Date.now()}`,
      nodeId: currentNode._id,
      content: newAnnotation.trim(),
      tags: newTag ? [newTag.trim()] : [],
      timestamp: Date.now(),
    };

    addAnnotation(annotation);
    setNewAnnotation('');
    setNewTag('');
  };

  const getEdgeColor = (edgeType: string) => {
    switch (edgeType) {
      case 'depends_on': return 'text-green-500';
      case 'contradicts': return 'text-red-500';
      case 'refines': return 'text-indigo-500';
      case 'knn': return 'text-neutral-400';
      default: return 'text-muted-foreground';
    }
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'section': return <FileText className="h-4 w-4 text-sky-500" />;
      case 'lemma': return <GitBranch className="h-4 w-4 text-violet-500" />;
      case 'theorem': return <Zap className="h-4 w-4 text-green-500" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const neighbors = currentNode ? getNeighbors(currentNode._id) : null;
  const nodeAnnotations = currentNode ? annotations.get(currentNode._id) || [] : [];

  return (
    <motion.div
      initial={{ x: -400 }}
      animate={{ x: 0 }}
      exit={{ x: -400 }}
      className="fixed left-0 top-0 h-full w-80 bg-background border-r shadow-lg z-20 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInspectorOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {currentNode ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentNode._id}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-2">
                    {getNodeIcon(currentNode.type)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm leading-tight">
                        {currentNode.label || currentNode.title || currentNode._key}
                      </CardTitle>
                      <CardDescription>
                        {currentNode.type} • {currentNode._key}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {currentNode.doc_id && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Document ID
                      </label>
                      <p className="text-sm">{currentNode.doc_id}</p>
                    </div>
                  )}

                  {currentNode.content && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Content
                      </label>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {currentNode.content}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyId(currentNode._id)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy ID
                    </Button>
                    {currentNode.title && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyTitle(currentNode.title!)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Title
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Neighbors */}
              {neighbors && (
                <Accordion type="multiple" defaultValue={['outgoing', 'incoming']}>
                  {neighbors.outgoing.length > 0 && (
                    <AccordionItem value="outgoing">
                      <AccordionTrigger>
                        Outgoing ({neighbors.outgoing.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {neighbors.outgoing.map(({ node, edge }) => (
                            <motion.div
                              key={`${edge._id}-${node._id}`}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-accent"
                              onClick={() => centerOnNode(node._id)}
                            >
                              {getNodeIcon(node.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {node.label || node.title || node._key}
                                </p>
                                <p className={`text-xs ${getEdgeColor(edge.type)}`}>
                                  {edge.type}
                                </p>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </motion.div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {neighbors.incoming.length > 0 && (
                    <AccordionItem value="incoming">
                      <AccordionTrigger>
                        Incoming ({neighbors.incoming.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {neighbors.incoming.map(({ node, edge }) => (
                            <motion.div
                              key={`${edge._id}-${node._id}`}
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-accent"
                              onClick={() => centerOnNode(node._id)}
                            >
                              {getNodeIcon(node.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {node.label || node.title || node._key}
                                </p>
                                <p className={`text-xs ${getEdgeColor(edge.type)}`}>
                                  {edge.type}
                                </p>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground" />
                            </motion.div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              )}

              {/* Annotations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Annotations</CardTitle>
                  <CardDescription>Local notes and tags</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Existing annotations */}
                  <AnimatePresence>
                    {nodeAnnotations.map((annotation) => (
                      <motion.div
                        key={annotation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-2 bg-muted rounded text-sm"
                      >
                        <p>{annotation.content}</p>
                        {annotation.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {annotation.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(annotation.timestamp).toLocaleString()}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAnnotation(currentNode._id, annotation.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Add new annotation */}
                  <div className="space-y-2">
                    <textarea
                      value={newAnnotation}
                      onChange={(e) => setNewAnnotation(e.target.value)}
                      placeholder="Add a note..."
                      className="w-full text-sm p-2 border rounded resize-none"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Tag (optional)"
                        className="flex-1 text-sm p-1 border rounded"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddAnnotation}
                        disabled={!newAnnotation.trim()}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Select a node to view details</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}