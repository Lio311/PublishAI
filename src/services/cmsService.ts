/**
 * CMS Service
 * Handles interactions with external CMS platforms, specifically WordPress for the MVP.
 */

export class CollisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollisionError';
  }
}

export interface PostMetadata {
  seoTitle?: string;
  tags?: string[];
  featuredImage?: string; // URL or media ID
}

export interface PostUpdatePayload {
  title?: string;
  content: string;
  metadata?: PostMetadata;
}

/**
 * Local representation of a post stored in our database.
 */
export interface LocalPost {
  id: string;
  remoteId: string;
  // The timestamp of the last known edit/update on the remote CMS
  lastKnownRemoteUpdatedAt: Date;
}

/**
 * Simulates fetching the current state of the post from WordPress.
 */
export async function getRemotePostMetadata(remoteId: string): Promise<{ updatedAt: Date }> {
  // TODO: Replace with actual WordPress REST API GET request
  // e.g., fetch(`https://example.com/wp-json/wp/v2/posts/${remoteId}`)
  
  // Returning a dummy timestamp for scaffolding purposes
  return {
    updatedAt: new Date(), 
  };
}

/**
 * Simulates updating a post in WordPress.
 */
export async function updateWordPressPost(remoteId: string, payload: PostUpdatePayload): Promise<{ newUpdatedAt: Date }> {
  // TODO: Replace with actual WordPress REST API POST/PUT request
  // Need to map our `PostUpdatePayload` to WordPress specific fields:
  // - content -> content
  // - metadata.seoTitle -> yoast_head or similar meta field depending on SEO plugin
  // - metadata.tags -> tags
  // - metadata.featuredImage -> featured_media
  
  console.log(`[CMS] Updating WordPress post ${remoteId}`, payload);
  
  return {
    newUpdatedAt: new Date(), // Simulate new update timestamp returned from WP
  };
}

/**
 * Verifies that the remote post has not been modified since our last sync,
 * and if safe, publishes the update to the CMS.
 *
 * @param localPost The post record from the local database
 * @param payload The content and metadata to update
 * @returns The new update timestamp from the CMS (which should be saved to the local database)
 * @throws {CollisionError} If the remote post was updated more recently than our local record
 */
export async function verifyAndPublishUpdate(
  localPost: LocalPost,
  payload: PostUpdatePayload
): Promise<{ newUpdatedAt: Date }> {
  // 1. Fetch the actual remote last_updated_at timestamp from the CMS
  const remoteData = await getRemotePostMetadata(localPost.remoteId);

  // 2. Collision Detection: Check if the remote has been updated more recently than the last known edit
  if (remoteData.updatedAt.getTime() > localPost.lastKnownRemoteUpdatedAt.getTime()) {
    throw new CollisionError(
      `Collision detected: The post has been modified on the CMS since your last edit. ` +
      `Remote updated at: ${remoteData.updatedAt.toISOString()}, Local last known update: ${localPost.lastKnownRemoteUpdatedAt.toISOString()}.`
    );
  }

  // 3. Publish the update to the CMS
  const updateResult = await updateWordPressPost(localPost.remoteId, payload);
  
  return updateResult;
}
