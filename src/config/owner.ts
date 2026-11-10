/**
 * Multi-User Authorization Configuration
 * Every authenticated user has their own private, isolated financial workspace.
 */

/**
 * Checks whether the user is authorized.
 * In multi-user mode, any authenticated user with a valid UID/email is authorized to access their own workspace.
 */
export function isAuthorizedUser(email: string | null | undefined): boolean {
  return Boolean(email && email.trim().length > 0 && email.includes('@'));
}

/**
 * Backward compatibility alias for isAuthorizedUser.
 */
export const isAuthorizedOwner = isAuthorizedUser;

/**
 * Returns the isolated Firestore path for a user's collection.
 */
export function getUserWorkspacePath(uid: string, subcollection: string): string {
  if (!uid || uid.trim().length === 0) {
    throw new Error('User UID is required to access workspace');
  }
  return `users/${uid}/${subcollection}`;
}
