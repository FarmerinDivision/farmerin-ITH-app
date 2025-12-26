import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

export default function Usuario({ onBack }) {
    const { currentUser } = useAuth();
    const [tambos, setTambos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        const tambosRef = ref(db, "tambos");
        const unsubscribe = onValue(tambosRef, (snapshot) => {
            const data = snapshot.val();
            const userTambos = [];
            if (data) {
                Object.keys(data).forEach((key) => {
                    const tamboData = data[key];
                    if (tamboData.usuario && tamboData.usuario.UID_usuario === currentUser.uid) {
                        userTambos.push({
                            id: key,
                            nombre: key.replace(/_/g, ' ')
                        });
                    }
                });
            }
            setTambos(userTambos);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    return (
        <View style={styles.container}>
            <View style={styles.navBar}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹ Atrás</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.headerTitle}>Usuario</Text>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.label}>Nombre:</Text>
                    <Text style={styles.value}>{currentUser?.displayName || "No registrado"}</Text>

                    <View style={styles.divider} />

                    <Text style={styles.label}>Correo Electrónico:</Text>
                    <Text style={styles.value}>{currentUser?.email}</Text>
                </View>

                <Text style={styles.sectionTitle}>Mis Tambos</Text>
                {loading ? (
                    <ActivityIndicator size="small" color="#007bff" />
                ) : (
                    <View style={styles.card}>
                        {tambos.length > 0 ? (
                            tambos.map((tambo, index) => (
                                <View key={tambo.id} style={[styles.tamboItem, index < tambos.length - 1 && styles.borderBottom]}>
                                    <Text style={styles.tamboName}>{tambo.nombre}</Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.noData}>No tienes tambos asociados.</Text>
                        )}
                    </View>
                )}
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
    backButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
    },
    backButtonText: {
        color: "#297eba",
        fontWeight: "600",
        fontSize: 14,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        backgroundColor: '#297eba',
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
    content: {
        padding: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontWeight: '500'
    },
    value: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333'
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 15
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 10,
        marginLeft: 5,
        textTransform: 'uppercase'
    },
    tamboItem: {
        paddingVertical: 12,
    },
    borderBottom: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    tamboName: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500'
    },
    noData: {
        color: '#999',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 10
    }
});
