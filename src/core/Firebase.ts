import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
const auth = getAuth(app);

// Helper for timing out promises
const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} Timeout`)), ms))
    ]);
};

export interface RankingEntry {
    name: string;
    score: number;
    timestamp: number;
}

export async function submitScore(name: string, score: number) {
    console.log("submitScore start:", name, score);
    try {
        // Ensure we are signed in
        await withTimeout(signInAnonymously(auth), 3000, "Auth");
        console.log("Auth success");

        const docRef = await withTimeout(addDoc(collection(db, "rankings"), {
            name,
            score,
            timestamp: Date.now()
        }), 4000, "AddDoc");
        console.log("Score written:", docRef.id);
    } catch (e) {
        console.error("submitScore error:", e);
    }
}

export async function getTopRankings(count: number = 10): Promise<RankingEntry[]> {
    console.log("getTopRankings start");
    try {
        // Ensure we are signed in
        await withTimeout(signInAnonymously(auth), 3000, "Auth");

        const q = query(collection(db, "rankings"), orderBy("score", "desc"), limit(count));
        const querySnapshot = await withTimeout(getDocs(q), 4000, "GetDocs");

        const rankings: RankingEntry[] = [];
        querySnapshot.forEach((doc) => {
            rankings.push(doc.data() as RankingEntry);
        });
        return rankings;
    } catch (e) {
        console.error("getTopRankings error:", e);
        return [];
    }
}
