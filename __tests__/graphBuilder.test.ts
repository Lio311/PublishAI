import { buildGraphFromRelationships } from '../src/services/graph/graphBuilder';
import { db } from '@/services/db';

jest.mock('@/services/db', () => ({
  db: {
    insert: jest.fn(),
    query: {
      scientificEntities: {
        findMany: jest.fn(),
      }
    }
  }
}));

describe('graphBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing if entities is empty', async () => {
    await buildGraphFromRelationships(1, { entities: [], relationships: [] });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('inserts entities and relationships', async () => {
    const mockOnConflictDoNothing = jest.fn();
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoNothing: mockOnConflictDoNothing
      })
    });

    (db.query.scientificEntities.findMany as jest.Mock).mockResolvedValue([
      { id: 1, name: 'entity1' },
      { id: 2, name: 'entity2' }
    ]);

    await buildGraphFromRelationships(1, {
      entities: [
        { name: 'Entity1', type: 'Concept', description: 'desc1' },
        { name: 'Entity2', type: 'Concept', description: 'desc2' }
      ],
      relationships: [
        { sourceName: 'Entity1', targetName: 'Entity2', relationshipType: 'RELATED', evidenceText: 'evidence', confidenceScore: 0.9 }
      ]
    });

    // 2 entities + 1 relationship bulk insert = 3 calls to insert
    expect(db.insert).toHaveBeenCalledTimes(3);
    expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(2);
  });
});
