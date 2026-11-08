// Push notifications used Firebase Cloud Messaging, which has been removed
// with the move to MySQL. No page called these yet; they now report that
// push is unavailable so callers fall back gracefully. In-app notifications
// (the `notifications` table) still work.

export interface MessagePayload {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}

export async function requestPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch {
    return false;
  }
}

export async function getMessagingToken(): Promise<string | null> {
  return null;
}

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  void callback;
  return null;
}
