import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { HistoryItem, CertRecord, User } from '../types';

// REPLACE WITH YOUR FIREBASE PROJECT CONFIG FROM GOOGLE CONSOLE
const firebaseConfig = {
  apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- AUTH ---
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    return {
      id: u.uid,
      name: u.displayName || 'Unknown',
      email: u.email || '',
      avatar: u.photoURL || undefined,
      provider: 'google-workspace',
      role: 'user' // In real app, check custom claims or a users collection
    };
  } catch (error) {
    console.error("Auth Error", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await signOut(auth);
};

// --- HISTORY ---
export const addHistoryItem = async (item: Omit<HistoryItem, 'id' | 'timestamp'>, userId: string, userName?: string) => {
  try {
    await addDoc(collection(db, 'history'), {
      ...item,
      user_id: userId,
      user_name: userName,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error adding history", e);
  }
};

export const getHistoryItems = async (userId: string, role?: string): Promise<HistoryItem[]> => {
  try {
    const historyRef = collection(db, 'history');
    let q;
    
    if (role === 'admin') {
      q = query(historyRef, orderBy('timestamp', 'desc'), limit(100));
    } else {
      q = query(historyRef, where('user_id', '==', userId), orderBy('timestamp', 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as HistoryItem));
  } catch (e) {
    console.error("Error fetching history", e);
    return [];
  }
};

export const clearUserHistory = async (userId: string) => {
  const historyRef = collection(db, 'history');
  const q = query(historyRef, where('user_id', '==', userId));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, 'history', d.id)));
  await Promise.all(deletePromises);
};

// --- CERTIFICATES ---
export const addCertRecord = async (cert: Omit<CertRecord, 'id' | 'timestamp'>) => {
  await addDoc(collection(db, 'certificates'), {
    ...cert,
    timestamp: Date.now()
  });
};

export const getCertRecords = async (): Promise<CertRecord[]> => {
  const q = query(collection(db, 'certificates'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as CertRecord));
};

export const deleteCertRecord = async (id: string) => {
  await deleteDoc(doc(db, 'certificates', id));
};