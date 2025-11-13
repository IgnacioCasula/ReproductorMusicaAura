import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCWikOBRmsKZWN02nBYKxKegNh-UzgX26o",
  authDomain: "nombreproyecto01.firebaseapp.com",
  projectId: "nombreproyecto01",
  storageBucket: "nombreproyecto01.firebasestorage.app",
  messagingSenderId: "1082039109883",
  appId: "1:1082039109883:web:2377f4a83529084cbb885e"
};

const app = initializeApp(firebaseConfig);

// ✅ CONFIGURACIÓN CORRECTA CON PERSISTENCIA
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);

export { auth, db };