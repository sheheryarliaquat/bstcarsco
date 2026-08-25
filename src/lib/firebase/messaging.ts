import { getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { app } from './config';
import { getMessaging, type Messaging } from 'firebase/messaging';

let _messaging: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!_messaging) {
    try {
      _messaging = getMessaging(app());
    } catch {
      return null;
    }
  }
  return _messaging;
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
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      return currentToken;
    }

    return null;
  } catch {
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  return onMessage(messaging, (payload) => {
    callback(payload);
  });
}
