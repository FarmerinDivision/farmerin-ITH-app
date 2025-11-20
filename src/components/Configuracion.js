import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-native";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function Configuracion() {
    const { currentUser, logout } = useAuth();
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleLogout() {
        setError("");
        try {
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to log out");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Configuración</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.profileInfo}>
                <Text style={styles.text}>
                    <Text style={styles.label}>Email: </Text>
                    {currentUser && currentUser.email}
                </Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <Link to="/home">
                    <Text style={styles.link}>Volver al Home</Text>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f4f4f9",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#444",
    },
    profileInfo: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 8,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    text: {
        fontSize: 18,
    },
    label: {
        fontWeight: "bold",
    },
    actions: {
        marginTop: 20,
    },
    logoutButton: {
        backgroundColor: "#dc3545",
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
    },
    logoutButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    error: {
        color: "#721c24",
        backgroundColor: "#f8d7da",
        padding: 10,
        borderRadius: 4,
        marginBottom: 15,
        textAlign: "center",
    },
    footer: {
        marginTop: 20,
        alignItems: "center",
    },
    link: {
        color: "#007bff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
