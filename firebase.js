// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApg1Zdg7caULI2W124pSk2VWbWKSxjgFw",
  authDomain: "forza-racing-series.firebaseapp.com",
  projectId: "forza-racing-series",
  storageBucket: "forza-racing-series.appspot.com",
  messagingSenderId: "103710151910",
  appId: "1:103710151910:web:da42741e1d9643758f5727",
  measurementId: "G-ZD8QQWYPRJ",
  databaseURL: "https://forza-racing-series-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Realtime Database and get a reference to the service
const db = getDatabase(app);

export { db };
