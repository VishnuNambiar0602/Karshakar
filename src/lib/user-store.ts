import 'server-only';

import { getFirestore } from '@/lib/firebase';

export type UserPreferences = {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  reducedMotion?: boolean;
};

export type UserHistoryItem = {
  id: string;
  createdAt: string;
  kind: 'dashboard' | 'chat';
  payload: Record<string, unknown>;
};

const PREFS_COLLECTION = 'user_preferences';
const HISTORY_COLLECTION = 'user_history';

export async function saveUserPreferences(userId: string, preferences: UserPreferences): Promise<void> {
  const db = getFirestore();
  await db.collection(PREFS_COLLECTION).doc(userId).set(
    {
      ...preferences,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const db = getFirestore();
  const doc = await db.collection(PREFS_COLLECTION).doc(userId).get();
  if (!doc.exists) {
    return null;
  }

  const data = doc.data() as UserPreferences | undefined;
  return data ?? null;
}

export async function appendUserHistory(userId: string, item: UserHistoryItem): Promise<void> {
  const db = getFirestore();
  await db.collection(HISTORY_COLLECTION).doc(userId).collection('items').doc(item.id).set(item);
}

export async function listUserHistory(userId: string, limit = 20): Promise<UserHistoryItem[]> {
  const db = getFirestore();
  const snapshot = await db
    .collection(HISTORY_COLLECTION)
    .doc(userId)
    .collection('items')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => doc.data() as UserHistoryItem);
}
