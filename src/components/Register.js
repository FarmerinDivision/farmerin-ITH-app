import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-native";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView } from "react-native";

export default function Register() {
    // Estados para el formulario
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Obtener función signup del contexto de autenticación
    const { signup } = useAuth();
    const navigate = useNavigate();

    /**
     * Maneja el envío del formulario de registro.
     * Intenta crear un nuevo usuario en Firebase.
     */
    /**
     * Valida los campos del formulario.
     * @returns {boolean} true si es válido, false si hay errores.
     */
    const validate = () => {
        let newErrors = {};
        if (!firstName.trim()) newErrors.firstName = "Campo requerido";
        if (!lastName.trim()) newErrors.lastName = "Campo requerido";
        if (!email.trim()) newErrors.email = "Campo requerido";
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email inválido";

        if (!password) newErrors.password = "Campo requerido";
        else if (password.length < 6) newErrors.password = "Mínimo 6 caracteres";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // True si no hay claves de error
    };

    /**
     * Maneja el envío del formulario de registro.
     * Intenta crear un nuevo usuario en Firebase.
     */
    async function handleSubmit() {
        if (!validate()) {
            return; // Detener si hay errores
        }

        try {
            setError("");
            setLoading(true);
            // Llamada a función de creación de usuario con nombre
            await signup(email, password, firstName, lastName);
            // Redirigir al dashboard tras éxito
            navigate("/home");
        } catch (err) {
            // Mostrar error si falla
            setError("Error al crear la cuenta: " + err.message);
        }

        setLoading(false);
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Registrarse</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Nombre</Text>
                    <TextInput
                        style={[styles.input, errors.firstName && styles.inputError]}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Ej. Farmerin"
                        placeholderTextColor="#aaa"
                    />
                    {errors.firstName && <Text style={styles.fieldError}>{errors.firstName}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Apellido</Text>
                    <TextInput
                        style={[styles.input, errors.lastName && styles.inputError]}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Ej. FreshCow"
                        placeholderTextColor="#aaa"
                    />
                    {errors.lastName && <Text style={styles.fieldError}>{errors.lastName}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        placeholder="ejemplo@correo.com"
                        placeholderTextColor="#aaa"
                    />
                    {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Contraseña</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        placeholder="********"
                        placeholderTextColor="#aaa"
                    />
                    {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Crear cuenta</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <View style={{ alignItems: 'center', width: '100%' }}>
                    <TouchableOpacity
                        onPress={() => navigate('/login')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.linkText}>¿Ya tienes una cuenta? <Text style={styles.linkBold}>Ir al inicio</Text></Text>
                    </TouchableOpacity>

                    <View style={{ marginTop: 30 }}>
                        <Text style={styles.textVersion}>Farmerin Division S.A. - &copy; 2020</Text>
                        <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
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
        borderRadius: 15,
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
        alignItems: "center",
        paddingBottom: 20
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
    },
    inputError: {
        borderColor: '#d9534f',
        borderWidth: 1.5
    },
    fieldError: {
        color: '#d9534f',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 5
    }
});
