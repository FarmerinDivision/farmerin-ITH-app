import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, Navigate } from "react-router-native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Login() {
    console.log("Login component rendering");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const { login, currentUser, resetPassword } = useAuth();
    const navigate = useNavigate();

    if (currentUser) {
        return <Navigate to="/home" />;
    }

    async function handleSubmit() {
        if (!email || !password) {
            return setError("Por favor ingrese email y contraseña.");
        }
        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/home");
        } catch (err) {
            console.error(err);
            const message = getFriendlyErrorMessage(err.code);
            setError(message);
        }
        setLoading(false);
    }

    async function handleResetPasswordSubmit() {
        if (!email) {
            return Alert.alert("Atención", "Por favor ingrese su email para restablecer la contraseña.");
        }
        try {
            setError("");
            setLoading(true);
            await resetPassword(email);
            Alert.alert("Correo enviado", "Revise su correo para poder cambiar su contraseña. Si no lo encuentra, verifique su spam.");
            setIsResettingPassword(false); // Optionally go back to login
        } catch (err) {
            setError("Error al enviar correo de restablecimiento: " + err.message);
        }
        setLoading(false);
    }

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>
                    {isResettingPassword ? "Recuperar Contraseña" : "Iniciar Sesión"}
                </Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor="#aaa"
                    />
                </View>

                {!isResettingPassword && (
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                placeholder="********"
                                placeholderTextColor="#aaa"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color="#777" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {isResettingPassword ? (
                    <>
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPasswordSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Presionar para recuperar contraseña</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setIsResettingPassword(false)}
                            style={styles.forgotButton}
                        >
                            <Text style={styles.forgotText}>Volver</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Ingresar</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsResettingPassword(true)}
                            style={styles.forgotButton}
                        >
                            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <View style={styles.footer}>
                <View style={{ alignItems: 'center', width: '100%' }}>
                    <TouchableOpacity
                        onPress={() => navigate('/register')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.linkText}>¿No estás registrado? <Text style={styles.linkBold}>Crear cuenta</Text></Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.textVersion}>Farmerin Division S.A. - &copy; 2020</Text>
                        <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "#f4f4f9", // Background color consistent with app
    },
    logo: {
        width: 300,
        height: 150,
        alignSelf: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 15, // Softer corners
        padding: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 30,
        color: "#297eba", // Primary app color
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: "600",
        color: "#555",
        fontSize: 14,
    },
    input: {
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 15,
        borderRadius: 10,
        fontSize: 16,
        color: "#333",
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#f9f9f9",
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 15, // Padding for container, input removal
    },
    passwordInput: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: "#333",
    },
    eyeButton: {
        padding: 5,
    },
    button: {
        backgroundColor: "#4db14f", // Primary app color
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#4db14f",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonDisabled: {
        backgroundColor: "#a0c4e3",
    },
    buttonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        textAlign: 'center'
    },
    forgotButton: {
        marginTop: 15,
        alignItems: "center",
    },
    forgotText: {
        color: "#777",
        fontSize: 14,
        textDecorationLine: "underline",
    },
    error: {
        color: "#721c24",
        backgroundColor: "#f8d7da",
        padding: 12,
        borderRadius: 10,
        marginBottom: 20,
        textAlign: "center",
        overflow: 'hidden'
    },
    footer: {
        marginTop: 30,
        justifyContent: "center",
        alignItems: "center"
    },
    footerText: {
        color: "#666",
        fontSize: 16,
        marginBottom: 5,
    },
    link: {
        color: "#297eba",
        fontWeight: "bold",
        fontSize: 16,
    },
    textVersion: {
        color: "#888",
        fontSize: 10,
        textAlign: "center",
        marginTop: 2
    },
    linkText: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginTop: 10
    },
    linkBold: {
        fontWeight: 'bold',
        color: '#297eba'
    }
});

function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-credential':
            return 'Correo electrónico o contraseña incorrectos.';
        case 'auth/user-not-found':
            return 'No existe una cuenta con este correo.';
        case 'auth/wrong-password':
            return 'Contraseña incorrecta.';
        case 'auth/invalid-email':
            return 'Formato de correo inválido.';
        case 'auth/too-many-requests':
            return 'Demasiados intentos fallidos. Intente más tarde.';
        default:
            return 'Error al iniciar sesión. Verifique sus datos.';
    }
}
