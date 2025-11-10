import { getAuth, getFirestore } from "../config/firebase.config.js";

export async function getUserProfile(uid) {
  if (!uid) return null;

  const db = getFirestore();
  const doc = await db.collection("profiles").doc(uid).get();
  
  if (!doc.exists) {
    return null;
  }

  return {
    uid,
    ...doc.data(),
  };
}

export async function upsertUserProfile(uid, data) {
  if (!uid) {
    throw new Error("UID é obrigatório");
  }

  const db = getFirestore();
  const ref = db.collection("profiles").doc(uid);
  
  const updateData = {
    name: data.name ?? null,
    email: data.email ?? null,
    avatar_url: data.avatar_url ?? null,
    updatedAt: new Date().toISOString(),
  };

  if (data.passwordHash) {
    updateData.passwordHash = data.passwordHash;
  }

  const doc = await ref.get();
  if (!doc.exists) {
    updateData.createdAt = new Date().toISOString();
  }

  await ref.set(updateData, { merge: true });
  
  const updated = await ref.get();
  return {
    uid,
    ...updated.data(),
  };
}

export async function findAuthUserByEmail(email) {
  if (!email) return null;

  const auth = getAuth();
  
  try {
    const user = await auth.getUserByEmail(email.trim().toLowerCase());
    return user;
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return null;
    }
    throw error;
  }
}

export async function getUserProfileByEmail(email) {
  if (!email) return null;

  const db = getFirestore();
  const snapshot = await db
    .collection("profiles")
    .where("email", "==", email.trim().toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    uid: doc.id,
    ...doc.data(),
  };
}
