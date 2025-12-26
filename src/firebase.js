import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDatabase } from "firebase/database";

// TODO: Reemplazar con la configuración de tu proyecto Firebase
// Ver: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: "AIzaSyAhClLvAdEiz8do8WfsTZn-qKFqfvia_uc",
  authDomain: "freshcow-ith.firebaseapp.com",
  databaseURL: "https://freshcow-ith-default-rtdb.firebaseio.com",
  projectId: "freshcow-ith",
  storageBucket: "freshcow-ith.firebasestorage.app",
  messagingSenderId: "283897248652",
  appId: "1:283897248652:web:236f73950ea2b28959f4a9",
  measurementId: "G-3VE84RC7YE"
};

// Inicializar la aplicación de Firebase
console.log("Initializing Firebase app...");
const app = initializeApp(firebaseConfig);

// Inicializar servicios y exportarlos para uso en la app
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
}); // Servicio de Autenticación con persistencia
export const db = getDatabase(app); // Servicio de Base de Datos en Tiempo Real
console.log("Firebase services initialized");
