import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBNPvRVxzxAFPnPK5shSzTtwr6x7UMXg1g",
  authDomain: "iot-dashboard-86cce.firebaseapp.com",
  databaseURL: "https://iot-dashboard-86cce-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-dashboard-86cce",
  storageBucket: "iot-dashboard-86cce.appspot.com",
  messagingSenderId: "105140968635",
  appId: "1:105140968635:web:0a97e1a3be0573b45d9d9e",
  measurementId: "G-JFXB248TED",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
