import {
  verifyAndPublishUpdate,
  CollisionError,
  LocalPost,
  PostUpdatePayload,
  getRemotePostMetadata,
  updateWordPressPost
} from '../../services/cmsService';

jest.mock('../../services/cmsService', () => {
  const originalModule = jest.requireActual('../../services/cmsService');
  return {
    ...originalModule,
    getRemotePostMetadata: jest.fn(),
    updateWordPressPost: jest.fn(),
  };
});

describe('cmsService - verifyAndPublishUpdate', () => {
  const mockLocalPost: LocalPost = {
    id: 'local-1',
    remoteId: 'remote-1',
    lastKnownRemoteUpdatedAt: new Date('2023-01-01T10:00:00Z'),
  };

  const mockPayload: PostUpdatePayload = {
    content: 'New content',
    title: 'New Title',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should publish update successfully when remote is NOT newer', async () => {
    const remoteData = { updatedAt: new Date('2023-01-01T10:00:00Z') };
    const newUpdatedTime = new Date('2023-01-01T12:00:00Z');
    
    (getRemotePostMetadata as jest.Mock).mockResolvedValue(remoteData);
    (updateWordPressPost as jest.Mock).mockResolvedValue({ newUpdatedAt: newUpdatedTime });

    const result = await verifyAndPublishUpdate(mockLocalPost, mockPayload);

    expect(getRemotePostMetadata).toHaveBeenCalledWith('remote-1');
    expect(updateWordPressPost).toHaveBeenCalledWith('remote-1', mockPayload);
    expect(result.newUpdatedAt).toEqual(newUpdatedTime);
  });

  it('should throw CollisionError when remote timestamp is newer', async () => {
    // Remote is newer than local
    const remoteData = { updatedAt: new Date('2023-01-01T11:00:00Z') };
    
    (getRemotePostMetadata as jest.Mock).mockResolvedValue(remoteData);

    await expect(verifyAndPublishUpdate(mockLocalPost, mockPayload)).rejects.toThrow(CollisionError);
    expect(getRemotePostMetadata).toHaveBeenCalledWith('remote-1');
    expect(updateWordPressPost).not.toHaveBeenCalled();
  });
});
