import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";

// Crear contexto de autenticación
const AuthContext = createContext();

// Hook personalizado para usar el contexto de autenticación
export function useAuth() {
    return useContext(AuthContext);
}

/**
 * Proveedor de contexto de autenticación.
 * Maneja el estado del usuario y expone funciones de auth.
 */
export function AuthProvider({ children }) {
    console.log("AuthProvider rendering");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Función para registro de usuario
    async function signup(email, password, firstName, lastName) {
        console.log("Signup attempt for:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Actualizar el perfil con el nombre y apellido
        if (firstName && lastName) {
            console.log("Updating profile with name:", firstName, lastName);
            await updateProfile(userCredential.user, {
                displayName: `${firstName} ${lastName}`
            });
            // Forzar actualización del estado local para reflejar el displayName inmediatamente
            setCurrentUser({ ...userCredential.user, displayName: `${firstName} ${lastName}` });
        }
        return userCredential;
    }

    // Función para inicio de sesión
    function login(email, password) {
        console.log("Login attempt for:", email);
        return signInWithEmailAndPassword(auth, email, password);
    }

    // Función para cierre de sesión
    function logout() {
        console.log("Logout attempt");
        return signOut(auth);
    }

    // Función para restablecer contraseña
    function resetPassword(email) {
        console.log("Reset password attempt for:", email);
        return sendPasswordResetEmail(auth, email);
    }

    // Efecto para escuchar cambios en el estado de autenticación (login/logout)
    useEffect(() => {
        console.log("AuthProvider mounted, setting up listener");
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed. User:", user ? user.email : "null");
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
