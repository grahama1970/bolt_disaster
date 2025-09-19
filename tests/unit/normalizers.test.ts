import { describe, it, expect } from '@jest/globals';
import { normalizePortableGraph } from '../../src/lib/normalizers/portable';
import { detectGraphFormat } from '../../src/lib/normalizers/db-native';
import { PortableGraph } from '../../src/types/graph';

describe('Graph Normalizers', () => {
  it('should normalize portable graph format', () => {
    const portableGraph: PortableGraph = {
      nodes: {
        sections: [
          { id: 's1', title: 'Introduction', type: 'section', doc_id: 'doc1' }
        ],
        lemmas: [
          { id: 'l1', title: 'Basic Lemma', type: 'lemma', doc_id: 'doc2' }
        ]
      },
      edges: {
        depends_on: [
          { from: 's1', to: 'l1', type: 'depends_on', weight: 0.8 }
        ]
      }
    };

    const normalized = normalizePortableGraph(portableGraph);
    
    expect(normalized.nodes).toHaveLength(2);
    expect(normalized.edges).toHaveLength(1);
    expect(normalized.nodes[0]._id).toBe('sections/s1');
    expect(normalized.edges[0]._from).toBe('sections/s1');
    expect(normalized.edges[0]._to).toBe('lemmas/l1');
  });

  it('should detect graph formats correctly', () => {
    const portableFormat = {
      nodes: { sections: [], lemmas: [] },
      edges: { depends_on: [] }
    };

    const dbNativeFormat = {
      nodes: [{ _id: 'test/1', _key: '1' }],
      edges: [{ _from: 'test/1', _to: 'test/2', type: 'depends_on' }]
    };

    expect(detectGraphFormat(portableFormat)).toBe('portable');
    expect(detectGraphFormat(dbNativeFormat)).toBe('db-native');
    expect(detectGraphFormat({})).toBe('unknown');
  });
});