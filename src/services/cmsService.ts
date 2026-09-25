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
 * Retrieves the WordPress configuration from environment variables.
 */
function getWpConfig() {
  const wpUrl = process.env.WP_API_URL;
  const wpUser = process.env.WP_USERNAME;
  const wpAppPassword = process.env.WP_APP_PASSWORD;

  if (!wpUrl) {
    throw new Error('WP_API_URL is not defined in environment variables');
  }

  return { wpUrl, wpUser, wpAppPassword };
}

/**
 * Generates authorization headers for WordPress REST API.
 */
function getAuthHeaders(wpUser?: string, wpAppPassword?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (wpUser && wpAppPassword) {
    const encoded = Buffer.from(`${wpUser}:${wpAppPassword}`).toString('base64');
    headers['Authorization'] = `Basic ${encoded}`;
  }

  return headers;
}

/**
 * Fetches the current state of the post from WordPress.
 */
export async function getRemotePostMetadata(remoteId: string): Promise<{ updatedAt: Date }> {
  const { wpUrl, wpUser, wpAppPassword } = getWpConfig();

  const response = await fetch(`${wpUrl}/wp/v2/posts/${remoteId}`, {
    method: 'GET',
    headers: getAuthHeaders(wpUser, wpAppPassword),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch post metadata from WordPress: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.modified_gmt) {
    // Fallback to 'modified' if 'modified_gmt' is not available
    if (data.modified) {
      return { updatedAt: new Date(data.modified) };
    }
    throw new Error('Unexpected response format from WordPress: missing "modified_gmt" field.');
  }

  return {
    updatedAt: new Date(data.modified_gmt + 'Z'),
  };
}

/**
 * Updates a post in WordPress.
 */
export async function updateWordPressPost(remoteId: string, payload: PostUpdatePayload): Promise<{ newUpdatedAt: Date }> {
  const { wpUrl, wpUser, wpAppPassword } = getWpConfig();

  // Map our `PostUpdatePayload` to WordPress specific fields
  const wpPayload: Record<string, any> = {
    content: payload.content,
  };

  if (payload.title) {
    wpPayload.title = payload.title;
  }

  if (payload.metadata) {
    if (payload.metadata.seoTitle) {
      // Assuming Yoast SEO or standard meta structure
      wpPayload.meta = {
        ...(wpPayload.meta || {}),
        _yoast_wpseo_title: payload.metadata.seoTitle,
      };
    }
    if (payload.metadata.tags) {
      // Need tag IDs for WP REST API, but pass as is in case the endpoint can parse strings or they are IDs
      wpPayload.tags = payload.metadata.tags; 
    }
    if (payload.metadata.featuredImage) {
      // featured_media expects an integer ID
      const mediaId = parseInt(payload.metadata.featuredImage, 10);
      if (!isNaN(mediaId)) {
        wpPayload.featured_media = mediaId;
      }
    }
  }

  const response = await fetch(`${wpUrl}/wp/v2/posts/${remoteId}`, {
    method: 'POST',
    headers: getAuthHeaders(wpUser, wpAppPassword),
    body: JSON.stringify(wpPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update post in WordPress: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.modified_gmt) {
    if (data.modified) {
      return { newUpdatedAt: new Date(data.modified) };
    }
    throw new Error('Unexpected response format from WordPress: missing "modified_gmt" field.');
  }

  return {
    newUpdatedAt: new Date(data.modified_gmt + 'Z'),
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
