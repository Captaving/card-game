// firebase.js - Подключение к Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDv2aMIyNPZazXZFsHRBbHhb2GKYMTGInY",
  authDomain: "card-game-eb9f1.firebaseapp.com",
  projectId: "card-game-eb9f1",
  storageBucket: "card-game-eb9f1.firebasestorage.app",
  messagingSenderId: "5336286232",
  appId: "1:5336286232:web:962f830660b7a9a9812f6d",
  measurementId: "G-8RGKPHBKHJ"
};

// Инициализация
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Экспорт функций
export { db, collection, addDoc, getDocs, doc, setDoc, getDoc };

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

// Сохранить колоду игрока
export async function saveDeck(userId, faction, cards) {
  try {
    await setDoc(doc(db, 'decks', `${userId}_${faction}`), {
      userId,
      faction,
      cards,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return true;
  } catch (e) {
    console.error('Ошибка сохранения колоды:', e);
    return false;
  }
}

// Загрузить колоду игрока
export async function loadDeck(userId, faction) {
  try {
    const docRef = doc(db, 'decks', `${userId}_${faction}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().cards;
    }
    return null;
  } catch (e) {
    console.error('Ошибка загрузки колоды:', e);
    return null;
  }
}

// Сохранить статистику игрока
export async function saveStats(userId, stats) {
  try {
    await setDoc(doc(db, 'users', userId), {
      userId,
      ...stats,
      updatedAt: new Date()
    }, { merge: true });
    return true;
  } catch (e) {
    console.error('Ошибка сохранения статистики:', e);
    return false;
  }
}