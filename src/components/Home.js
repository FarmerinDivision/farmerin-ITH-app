import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-native";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const [tambos, setTambos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        const tambosRef = ref(db, "tambos");
        const unsubscribe = onValue(tambosRef, (snapshot) => {
            const data = snapshot.val();
            const userTambos = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    const tamboData = data[key];
                    // Check if the tambo belongs to the current user
                    if (tamboData.usuario && tamboData.usuario.UID_usuario === currentUser.uid) {
                        userTambos.push({
                            id: key, // The key is the tambo name/ID
                            nombreTambo: key,
                            mediciones: tamboData.mediciones_ith,
                            usuario: tamboData.usuario.UID_usuario
                        });
                    }
                });
            }

            setTambos(userTambos);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Cargando tambos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mis Tambos</Text>

            {tambos.length === 0 ? (
                <Text style={styles.noData}>No tienes tambos registrados.</Text>
            ) : (
                <FlatList
                    data={tambos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.listItem}>
                            <Text style={styles.itemTitle}>{item.nombreTambo}</Text>
                            <Link to={`/tambo/${item.id}`} component={TouchableOpacity} style={styles.button}>
                                <Text style={styles.buttonText}>Ver Datos</Text>
                            </Link>
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                />
            )}

            <View style={styles.footer}>
                <Link to="/configuracion">
                    <Text style={styles.link}>Ir a Configuración</Text>
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#444",
    },
    list: {
        paddingBottom: 20,
    },
    listItem: {
        padding: 15,
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    itemTitle: {
        fontSize: 18,
        fontWeight: "500",
    },
    button: {
        backgroundColor: "#28a745",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
    },
    buttonText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
    },
    noData: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
    },
    footer: {
        marginTop: 20,
        alignItems: "center",
    },
    link: {
        color: "#007bff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
