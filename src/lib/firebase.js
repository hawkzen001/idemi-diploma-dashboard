import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKxESv2p80tpRQrltrgJCxkLAEJEUn738",
  authDomain: "idemi-aicte-dashboard.firebaseapp.com",
  projectId: "idemi-aicte-dashboard",
  storageBucket: "idemi-aicte-dashboard.firebasestorage.app",
  messagingSenderId: "666319325",
  appId: "1:666319325:web:9ec0875068e3854aa19e34",
  measurementId: "G-MR0HCM5HSS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper functions for reading/writing overrides
export const getOverrideData = async (type) => {
  try {
    const docRef = doc(db, 'overrides', type);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return {};
  } catch (error) {
    console.error(`Error fetching ${type} data from Firestore:`, error);
    return {};
  }
};

export const saveOverrideData = async (type, id, value) => {
  try {
    const docRef = doc(db, 'overrides', type);
    await setDoc(docRef, { [id]: value }, { merge: true });
    return true;
  } catch (error) {
    console.error(`Error saving ${type} data to Firestore:`, error);
    throw error;
  }
};
