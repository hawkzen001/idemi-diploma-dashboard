import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "idemi-aicte-dashboard",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, 'overrides', 'ssc');
setDoc(docRef, { ['6/23/2026 12:22:40anchitavk123@gmail.com']: '85' }, { merge: true })
  .catch(err => console.error("EXPECTED ERROR:", err.message));
