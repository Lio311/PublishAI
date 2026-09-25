import { memoryClient } from '@/lib/mem0';

/**
 * Saves context information for a specific user.
 * @param userId - The identifier of the user.
 * @param content - The context content to save.
 */
export async function saveUserContext(userId: string, content: string) {
  try {
    return await memoryClient.add([{ role: 'user', content }], { user_id: userId } as any);
  } catch (error) {
    console.error(`Error saving user context for userId ${userId}:`, error);
    throw error;
  }
}

/**
 * Fetches context information for a specific user.
 * @param userId - The identifier of the user.
 * @returns The accumulated context for the user.
 */
export async function fetchUserContext(userId: string) {
  try {
    return await memoryClient.search('Retrieve user context', { user_id: userId } as any);
  } catch (error) {
    console.error(`Error fetching user context for userId ${userId}:`, error);
    throw error;
  }
}
