import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    console.log("AuthProvider rendering");
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        console.log("Signup attempt for:", email);
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        console.log("Login attempt for:", email);
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        console.log("Logout attempt");
        return signOut(auth);
    }

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
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
