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

  it('should publish update successfully when remote is NOT newer', async () => {
    // Current dummy implementation of getRemotePostMetadata returns Date.now()
    // By setting lastKnownRemoteUpdatedAt to a future date, we simulate the remote NOT being newer
    const mockLocalPost: LocalPost = {
      id: 'local-1',
      remoteId: 'remote-1',
      lastKnownRemoteUpdatedAt: new Date(Date.now() + 10000), 
    };

    const result = await verifyAndPublishUpdate(mockLocalPost, mockPayload);
    expect(result).toHaveProperty('newUpdatedAt');
  });

  it('should throw CollisionError when remote timestamp is newer', async () => {
    // By setting lastKnownRemoteUpdatedAt to a past date, we simulate the remote being newer
    const mockLocalPost: LocalPost = {
      id: 'local-1',
      remoteId: 'remote-1',
      lastKnownRemoteUpdatedAt: new Date('2000-01-01T00:00:00Z'),
    };

    await expect(verifyAndPublishUpdate(mockLocalPost, mockPayload)).rejects.toThrow(CollisionError);
  });
});
