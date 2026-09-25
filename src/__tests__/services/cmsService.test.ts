import {
  verifyAndPublishUpdate,
  CollisionError,
  LocalPost,
  PostUpdatePayload,
} from '../../services/cmsService';

describe('cmsService - verifyAndPublishUpdate', () => {
  const mockPayload: PostUpdatePayload = {
    content: 'New content',
    title: 'New Title',
  };

  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, WP_API_URL: 'https://example.com/wp-json' };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should publish update successfully when remote is NOT newer', async () => {
    const remoteUpdatedAt = new Date('2023-01-01T12:00:00Z');
    const newRemoteUpdatedAt = new Date('2023-01-01T12:05:00Z');

    // First fetch for GET metadata, Second for POST update
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ modified_gmt: '2023-01-01T12:00:00' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ modified_gmt: '2023-01-01T12:05:00' })
    });

    const mockLocalPost: LocalPost = {
      id: 'local-1',
      remoteId: 'remote-1',
      lastKnownRemoteUpdatedAt: new Date('2023-01-01T12:00:00Z'), // same as remote, so not newer
    };

    const result = await verifyAndPublishUpdate(mockLocalPost, mockPayload);
    expect(result).toHaveProperty('newUpdatedAt');
    expect(result.newUpdatedAt.toISOString()).toBe(newRemoteUpdatedAt.toISOString());
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should throw CollisionError when remote timestamp is newer', async () => {
    // Remote is newer than local known timestamp
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ modified_gmt: '2023-01-02T12:00:00' }) // Updated later
    });

    const mockLocalPost: LocalPost = {
      id: 'local-1',
      remoteId: 'remote-1',
      lastKnownRemoteUpdatedAt: new Date('2023-01-01T12:00:00Z'),
    };

    await expect(verifyAndPublishUpdate(mockLocalPost, mockPayload)).rejects.toThrow(CollisionError);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Should not call the POST endpoint
  });
});
