import { ref, set, get, update } from 'firebase/database';
import { db } from './bot/firebase.js';

export async function getUser(userId) {
  const userRef = ref(db, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.val();
}

export async function createUser(userId, username) {
  const userRef = ref(db, `users/${userId}`);
  await set(userRef, { username, score: 0 });
}

export async function updateUserScore(userId, score) {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, { score: score });
}
