import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-native";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getStressLevel } from "../utils/ithLogic";
import { ESTADO_SISTEMA } from "../models/medicionITH";

export default function Home() {
    console.log("Home component rendering");
    const [tambos, setTambos] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            console.log("Home: No currentUser");
            return;
        }

        console.log("Home: Fetching tambos for user", currentUser.uid);
        const tambosRef = ref(db, "tambos");
        const unsubscribe = onValue(tambosRef, (snapshot) => {
            console.log("Home: Data received from firebase");
            const data = snapshot.val();
            const userTambos = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    const tamboData = data[key];
                    // Check if the tambo belongs to the current user
                    if (tamboData.usuario && tamboData.usuario.UID_usuario === currentUser.uid) {

                        // Parse mediciones to find the latest one and the last activation
                        let latestMedicion = null;
                        let lastActivation = null;

                        if (tamboData.mediciones_ith) {
                            const sortedKeys = Object.keys(tamboData.mediciones_ith).sort(); // timestamps as strings usually sort okay ISO8601
                            if (sortedKeys.length > 0) {
                                const latestKey = sortedKeys[sortedKeys.length - 1];
                                latestMedicion = tamboData.mediciones_ith[latestKey];

                                // Find last activation (Estado ON)
                                for (let i = sortedKeys.length - 1; i >= 0; i--) {
                                    const m = tamboData.mediciones_ith[sortedKeys[i]];
                                    if (m.estado === ESTADO_SISTEMA.ON) { // Look for integer 3
                                        lastActivation = m.date || sortedKeys[i]; // Use date field or key if date missing
                                        break;
                                    }
                                }
                            }
                        }

                        userTambos.push({
                            id: key, // The key is the tambo name/ID
                            nombreTambo: key,
                            mediciones: tamboData.mediciones_ith,
                            usuario: tamboData.usuario.UID_usuario,
                            lastMedicion,
                            lastActivation
                        });
                    }
                });
            }

            setTambos(userTambos);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const formatDate = (isoString) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return isoString;
        }
    };

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
            <Text style={styles.headerTitle}>Dashboard Resumen</Text>

            {tambos.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.noData}>No tienes tambos registrados.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {tambos.map((tambo) => {
                        // Default to NO_STRESS if no data 
                        const ithValue = tambo.lastMedicion ? tambo.lastMedicion.indice : 0;
                        const stressInfo = getStressLevel(ithValue);
                        const isSystemOn = tambo.lastMedicion ? tambo.lastMedicion.estado === ESTADO_SISTEMA.ON : false;

                        return (
                            <Link
                                key={tambo.id}
                                to={`/tambo/${tambo.id}`}
                                component={TouchableOpacity}
                                style={[styles.card, { borderLeftColor: stressInfo.color }]}
                                activeOpacity={0.8}
                            >
                                <View style={styles.cardHeader}>
                                    <Text style={styles.tamboName}>{tambo.nombreTambo}</Text>
                                    {tambo.lastMedicion && (
                                        <View style={[styles.badge, { backgroundColor: stressInfo.color }]}>
                                            <Text style={styles.badgeText}>{stressInfo.label}</Text>
                                        </View>
                                    )}
                                </View>

                                {tambo.lastMedicion ? (
                                    <View style={styles.cardBody}>
                                        <View style={styles.metricContainer}>
                                            <Text style={styles.metricLabel}>ITH Actual</Text>
                                            <Text style={[styles.metricValue, { color: stressInfo.color }]}>
                                                {ithValue}
                                            </Text>
                                        </View>

                                        <View style={styles.infoContainer}>
                                            <Text style={styles.infoText}>
                                                Estado: <Text style={{ fontWeight: 'bold', color: isSystemOn ? '#28a745' : '#666' }}>
                                                    {isSystemOn ? "ENCENDIDO" : "APAGADO"}
                                                </Text>
                                            </Text>
                                            <Text style={styles.infoText}>
                                                Última act.: {formatDate(tambo.lastActivation)}
                                            </Text>
                                        </View>
                                    </View>
                                ) : (
                                    <Text style={styles.noMedicionText}>Sin datos recientes</Text>
                                )}
                            </Link>
                        );
                    })}
                </ScrollView>
            )}

            <View style={styles.footer}>
                <Link to="/configuracion">
                    <Text style={styles.link}>Configuración</Text>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
        paddingTop: 20
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#333",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    tamboName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#444",
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        maxWidth: '50%'
    },
    badgeText: {
        color: "white",
        fontSize: 10, // Small text for label
        fontWeight: "bold",
        textAlign: 'center',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    cardBody: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metricContainer: {
        alignItems: "flex-start",
    },
    metricLabel: {
        fontSize: 12,
        color: "#888",
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 32,
        fontWeight: "bold",
    },
    infoContainer: {
        alignItems: "flex-end",
    },
    infoText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    noMedicionText: {
        fontStyle: 'italic',
        color: '#999',
        textAlign: 'center',
        marginTop: 10
    },
    noData: {
        textAlign: "center",
        fontSize: 16,
        color: "#666",
    },
    footer: {
        paddingVertical: 15,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: '#eee',
        backgroundColor: '#fff'
    },
    link: {
        color: "#007bff",
        fontWeight: "bold",
        fontSize: 16,
    },
});
