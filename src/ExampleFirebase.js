// ตัวอย่างการใช้ Firebase ใน component
import React from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function ExampleComponent() {
  // ตัวอย่างการ Login
  const handleLogin = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in:', userCredential.user);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // ตัวอย่างการเพิ่มข้อมูลใน Firestore
  const addData = async () => {
    try {
      const docRef = await addDoc(collection(db, "users"), {
        name: "Example User",
        email: "example@test.com",
        createdAt: new Date()
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div>
      <h2>Firebase Example</h2>
      <button onClick={() => handleLogin('email@example.com', 'password')}>
        Login
      </button>
      <button onClick={addData}>
        Add Data to Firestore
      </button>
    </div>
  );
}

export default ExampleComponent;
