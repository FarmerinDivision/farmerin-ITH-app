import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-native";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import Usuario from "./Usuario";
import Ayuda from "./Ayuda";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

export default function Configuracion() {
    // Obtener datos del usuario y función de logout
    const { currentUser, logout } = useAuth();
    const [error, setError] = useState("");
    const navigate = useNavigate();
    // 'menu', 'profile', 'help'
    const [currentView, setCurrentView] = useState("menu");

    // Funcion de boton volver atras (Navegar a pantalla anterior)
    const handleBack = () => {
        navigate(-1);
    };

    /**
     * Maneja el proceso de cerrar sesión.
     */
    async function handleLogout() {
        setError("");
        try {
            await logout();
            navigate("/login");
        } catch {
            setError("Failed to log out");
        }
    }

    /**
     * Componente reutilizable para botones de menú
     */
    const MenuButton = ({ title, onPress, color = '#fff', textColor = '#333' }) => (
        <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: color }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[styles.menuButtonText, { color: textColor }]}>{title}</Text>
            <Text style={[styles.menuButtonIcon, { color: textColor }]}>›</Text>
        </TouchableOpacity>
    );

    // RENDER: USUARIO
    if (currentView === "profile") {
        return <Usuario onBack={() => setCurrentView("menu")} />;
    }

    // RENDER: AYUDA
    if (currentView === "help") {
        return <Ayuda onBack={() => setCurrentView("menu")} />;
    }


    // RENDER:  MENU
    return (
        <View style={styles.container}>

            {/* 1. Apartado de Titulo */}
            <Text style={styles.headerTitle}>Configuracion</Text>

            {/* 2. Boton de Volver */}
            <TouchableOpacity onPress={handleBack} style={styles.fullWidthBackButton}>
                <Ionicons name="arrow-back" size={20} color="#297eba" style={{ marginRight: 8 }} />
                <Text style={styles.backButtonText}>Atras</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ScrollView contentContainerStyle={styles.menuContainer}>
                <Text style={styles.sectionHeader}>General</Text>

                <MenuButton
                    title="Usuario"
                    onPress={() => setCurrentView("profile")}
                />

                <MenuButton
                    title="Ayuda"
                    onPress={() => setCurrentView("help")}
                />

                <View style={styles.divider} />

                <MenuButton
                    title="Cerrar Sesión"
                    onPress={handleLogout}
                    color="#f8d7da"
                    textColor="#721c24"
                />

                <View style={{ marginTop: 30, paddingBottom: 20 }}>
                    <Text style={styles.textVersion}>Farmerin Division S.A. - &copy; 2020</Text>
                    <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
        paddingTop: 45 // Safe area top adjustment
    },
    navBar: {
        paddingHorizontal: 20,
        marginBottom: 10,
        alignItems: 'flex-start'
    },
    /// Boton Atras 
    fullWidthBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center text
        backgroundColor: '#fff',
        paddingVertical: 12,
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 10,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    backButtonText: {
        color: "#297eba",
        fontWeight: "600",
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        backgroundColor: '#297fba',
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
        marginHorizontal: 20
    },
    error: {
        color: "#721c24",
        backgroundColor: "#f8d7da",
        padding: 10,
        margin: 20,
        borderRadius: 15,
        textAlign: "center",
    },
    menuContainer: {
        padding: 20,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
        marginTop: 10,
        textTransform: 'uppercase'
    },
    userInfoBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        elevation: 1
    },
    userLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500'
    },
    userEmail: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333'
    },
    userData: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 12,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    menuButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    menuButtonIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        opacity: 0.5
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 20
    },
    textVersion: {
        color: "#888",
        fontSize: 10,
        textAlign: "center",
        marginTop: 2
    }
});
