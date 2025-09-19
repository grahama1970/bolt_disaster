import html2canvas from 'html2canvas';
import { GraphNode } from '../types/graph';

export async function exportGraphAsPNG(element: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher resolution
      useCORS: true,
    });
    
    const link = document.createElement('a');
    link.download = `lean4-graph-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  } catch (error) {
    console.error('Failed to export PNG:', error);
  }
}

export async function exportGraphAsSVG(element: HTMLElement): Promise<void> {
  try {
    // This is a simplified SVG export - in a real implementation,
    // you'd need to properly serialize the SVG elements
    const svgData = new XMLSerializer().serializeToString(element);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    
    const link = document.createElement('a');
    link.download = `lean4-graph-${Date.now()}.svg`;
    link.href = URL.createObjectURL(blob);
    link.click();
    
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Failed to export SVG:', error);
  }
}

export function exportSelectionAsCSV(nodes: GraphNode[]): void {
  const headers = ['ID', 'Key', 'Label', 'Type', 'Title', 'Doc ID'];
  const rows = nodes.map(node => [
    node._id,
    node._key,
    node.label || '',
    node.type,
    node.title || '',
    node.doc_id || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.download = `lean4-selection-${Date.now()}.csv`;
  link.href = URL.createObjectURL(blob);
  link.click();
  
  URL.revokeObjectURL(link.href);
}

export function exportSelectionAsJSON(nodes: GraphNode[]): void {
  const data = {
    timestamp: Date.now(),
    count: nodes.length,
    nodes: nodes,
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.download = `lean4-selection-${Date.now()}.json`;
  link.href = URL.createObjectURL(blob);
  link.click();
  
  URL.revokeObjectURL(link.href);
}