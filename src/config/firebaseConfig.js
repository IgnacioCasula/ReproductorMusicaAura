import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCPkAVFTX3n_952CpJgDvgG4c5-SuHi_0",
  authDomain: "nombreproyecto001.firebaseapp.com",
  projectId: "nombreproyecto001",
  storageBucket: "nombreproyecto001.firebasestorage.app",
  messagingSenderId: "859819502166",
  appId: "1:859819502166:web:89899c7aba0fa03c48a9f7"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

export { auth };

