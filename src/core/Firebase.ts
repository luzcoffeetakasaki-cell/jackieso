import { initializeApp } from "firebase/app";
import { initializeFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBPdGQUfS4RSfMTkkVE0vxhq9HiTnxzSUo",
    authDomain: "jackieso-64780.firebaseapp.com",
    projectId: "jackieso-64780",
    storageBucket: "jackieso-64780.firebasestorage.app",
    messagingSenderId: "424570265683",
    appId: "1:424570265683:web:ad21d9df78a115db44e6a6",
    measurementId: "G-8LKR6D2NTV"
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
