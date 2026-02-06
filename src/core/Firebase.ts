import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit } from "firebase/firestore";

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
export const db = getFirestore(app);

export interface RankingEntry {
    name: string;
    score: number;
    timestamp: number;
}

export async function submitScore(name: string, score: number) {
    try {
        await addDoc(collection(db, "rankings"), {
            name,
            score,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

export async function getTopRankings(count: number = 10): Promise<RankingEntry[]> {
    try {
        const q = query(collection(db, "rankings"), orderBy("score", "desc"), limit(count));
        const querySnapshot = await getDocs(q);
        const rankings: RankingEntry[] = [];
        querySnapshot.forEach((doc) => {
            rankings.push(doc.data() as RankingEntry);
        });
        return rankings;
    } catch (e) {
        console.error("Error getting documents: ", e);
        return [];
    }
}
