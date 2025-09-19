import { GraphFilters, CameraState } from '../state/store';

export interface DeepLinkState {
  focus?: string;
  selection?: string[];
  edges?: string[];
  depth?: number;
  neighbors?: boolean;
  search?: string;
  exact?: boolean;
  renderer?: 'sigma' | 'd3';
  theme?: 'light' | 'dark' | 'high-contrast';
  camera?: {
    x?: number;
    y?: number;
    ratio?: number;
  };
}

export function encodeStateToUrl(state: {
  focusedNode: string | null;
  selectedNodes: Set<string>;
  filters: GraphFilters;
  renderer: 'sigma' | 'd3';
  theme: 'light' | 'dark' | 'high-contrast';
  camera: CameraState;
}): string {
  const params = new URLSearchParams();
  
  if (state.focusedNode) {
    params.set('focus', state.focusedNode);
  }
  
  if (state.selectedNodes.size > 0) {
    params.set('selection', Array.from(state.selectedNodes).join(','));
  }
  
  if (state.filters.enabledEdgeTypes.size < 4) {
    params.set('edges', Array.from(state.filters.enabledEdgeTypes).join(','));
  }
  
  if (state.filters.traversalDepth !== 2) {
    params.set('depth', state.filters.traversalDepth.toString());
  }
  
  if (state.filters.includeNeighbors) {
    params.set('neighbors', 'true');
  }
  
  if (state.filters.search) {
    params.set('search', state.filters.search);
  }
  
  if (state.filters.exactMatch) {
    params.set('exact', 'true');
  }
  
  if (state.renderer !== 'sigma') {
    params.set('renderer', state.renderer);
  }
  
  if (state.theme !== 'light') {
    params.set('theme', state.theme);
  }
  
  if (state.camera.x !== 0.5 || state.camera.y !== 0.5 || state.camera.ratio !== 1) {
    params.set('camera', `${state.camera.x},${state.camera.y},${state.camera.ratio}`);
  }
  
  const url = new URL(window.location.href);
  url.search = params.toString();
  return url.toString();
}

export function decodeStateFromUrl(url: string = window.location.href): DeepLinkState {
  const urlObj = new URL(url);
  const params = urlObj.searchParams;
  
  const state: DeepLinkState = {};
  
  if (params.has('focus')) {
    state.focus = params.get('focus')!;
  }
  
  if (params.has('selection')) {
    state.selection = params.get('selection')!.split(',');
  }
  
  if (params.has('edges')) {
    state.edges = params.get('edges')!.split(',');
  }
  
  if (params.has('depth')) {
    state.depth = parseInt(params.get('depth')!, 10);
  }
  
  if (params.has('neighbors')) {
    state.neighbors = params.get('neighbors') === 'true';
  }
  
  if (params.has('search')) {
    state.search = params.get('search')!;
  }
  
  if (params.has('exact')) {
    state.exact = params.get('exact') === 'true';
  }
  
  if (params.has('renderer')) {
    state.renderer = params.get('renderer') as 'sigma' | 'd3';
  }
  
  if (params.has('theme')) {
    state.theme = params.get('theme') as 'light' | 'dark' | 'high-contrast';
  }
  
  if (params.has('camera')) {
    const [x, y, ratio] = params.get('camera')!.split(',').map(Number);
    state.camera = { x, y, ratio };
  }
  
  return state;
}

export function updateUrlWithState(state: DeepLinkState): void {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else if (typeof value === 'object') {
        params.set(key, Object.values(value).join(','));
      } else {
        params.set(key, value.toString());
      }
    }
  });
  
  url.search = params.toString();
  window.history.replaceState({}, '', url.toString());
}