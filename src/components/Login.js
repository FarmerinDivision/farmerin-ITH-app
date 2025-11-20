import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, Navigate } from "react-router-native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();

    if (currentUser) {
        return <Navigate to="/home" />;
    }

    async function handleSubmit() {
        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/home");
        } catch (err) {
            setError("Failed to log in: " + err.message);
        }

        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Iniciar Sesión</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text>Need an account? </Text>
                <Link to="/register">
                    <Text style={styles.link}>Ir a Registrarse</Text>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#444",
    },
    formGroup: {
        marginBottom: 15,
    },
    label: {
        marginBottom: 5,
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 10,
        borderRadius: 4,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 4,
        alignItems: "center",
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: "#ccc",
    },
    buttonText: {
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
        flexDirection: "row",
        justifyContent: "center",
    },
    link: {
        color: "#007bff",
        fontWeight: "bold",
    },
});
