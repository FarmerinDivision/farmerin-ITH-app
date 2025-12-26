import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link, useNavigate } from "react-router-native";
import { View, Text, FlatList, TouchableHighlight, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { useAuth } from "../context/AuthContext";
import { getStressLevel } from "../utils/ithLogic";
import { ESTADO_SISTEMA } from "../models/medicionITH";

export default function Home() {
    console.log("Home: Renderizando componente...");
    // Estado para lista de tambos
    const [tambos, setTambos] = useState([]);
    // Estado de carga
    const [loading, setLoading] = useState(true);
    // Obtener usuario actual del contexto de autenticación
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    /**
     * Efecto principal para cargar los tambos del usuario autenticado.
     * Escucha cambios en 'currentUser'.
     */
    useEffect(() => {
        if (!currentUser) {
            console.log("Home: No hay usuario actual (currentUser is null)");
            return;
        }

        console.log(`Home: Buscando tambos para el usuario: ${currentUser.email} (UID: ${currentUser.uid})`);
        const tambosRef = ref(db, "tambos");

        // Suscripción a la base de datos de Firebase
        const unsubscribe = onValue(tambosRef, (snapshot) => {
            console.log("Home: Datos recibidos de Firebase.");
            const data = snapshot.val();
            const userTambos = [];

            if (data) {
                const totalKeys = Object.keys(data).length;
                console.log(`Home: Se encontraron ${totalKeys} tambos en total en la base de datos.`);

                // Iterar sobre cada tambo en la DB
                Object.keys(data).forEach((key) => {
                    const tamboData = data[key];
                    // Verificar si el tambo pertenece al usuario actual
                    if (tamboData.usuario && tamboData.usuario.UID_usuario === currentUser.uid) {
                        console.log(`Home: Tambo encontrado para el usuario: ${key}`);

                        // Parsear mediciones para encontrar la última y la última activación
                        let latestMedicion = null;
                        let lastActivation = null;

                        if (tamboData.mediciones_ith) {
                            const sortedKeys = Object.keys(tamboData.mediciones_ith).sort(); // timestamps as strings usually sort okay ISO8601
                            if (sortedKeys.length > 0) {
                                // Última medición (más reciente) normalizando nombres de campos
                                const latestKey = sortedKeys[sortedKeys.length - 1];
                                const rawLatest = tamboData.mediciones_ith[latestKey] || {};
                                latestMedicion = {
                                    ...rawLatest,
                                    date: rawLatest.Date || rawLatest.date || latestKey,
                                    estado: rawLatest.Estado !== undefined ? rawLatest.Estado : rawLatest.estado,
                                    humedad: rawLatest.Humedad !== undefined ? rawLatest.Humedad : rawLatest.humedad,
                                    indice: rawLatest.Indice !== undefined ? rawLatest.Indice : rawLatest.indice,
                                    temperatura: rawLatest.Temperatura !== undefined ? rawLatest.Temperatura : rawLatest.temperatura,
                                };

                                // Buscar la última vez que el sistema se activó (Estado ON)
                                for (let i = sortedKeys.length - 1; i >= 0; i--) {
                                    const raw = tamboData.mediciones_ith[sortedKeys[i]] || {};
                                    const estado = raw.Estado !== undefined ? raw.Estado : raw.estado;
                                    if (estado === ESTADO_SISTEMA.ON) {
                                        const dateVal = raw.Date || raw.date || sortedKeys[i];
                                        lastActivation = dateVal;
                                        break;
                                    }
                                }
                            }
                        }

                        userTambos.push({
                            id: key,
                            // Mostrar el nombre legible sin guiones bajos
                            nombreTambo: key.replace(/_/g, ' '),
                            mediciones: tamboData.mediciones_ith,
                            usuario: tamboData.usuario.UID_usuario,
                            lastMedicion: latestMedicion,
                            lastActivation
                        });
                    }
                });
            } else {
                console.log("Home: No se recibieron datos de la base de datos (data is null).");
            }

            console.log(`Home: Total de tambos cargados para el usuario: ${userTambos.length}`);
            setTambos(userTambos);
            setLoading(false);
        });

        // Limpiar suscripción
        return unsubscribe;
    }, [currentUser]);

    /**
     * Formatea una cadena ISO a fecha y hora locales cortas.
     * @param {string} isoString - Fecha en formato ISO.
     * @returns {string} Fecha/hora formateada o guión si no hay fecha.
     */
    const formatDate = (isoString) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
        } catch (e) {
            return isoString;
        }
    };

    // Helpers: color conversions and contrast calculation
    // Configurable tuning constants (adjust to change visual intensity/contrast)
    const ITH_TINT_ALPHA = 0.16; // default tint opacity for ITH box (was 0.08)
    const CONTRAST_LUMINANCE_THRESHOLD = 186; // threshold for choosing black or white text

    const hexToRgba = (hex, alpha = 1) => {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(ch => ch + ch).join('');
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const getContrastingTextColor = (hex) => {
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c.split('').map(ch => ch + ch).join('');
        }
        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);
        // Perceived luminance
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        return luminance > CONTRAST_LUMINANCE_THRESHOLD ? '#000' : '#fff';
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
            <Text style={styles.headerTitle}>Selecionar Tambo</Text>

            {tambos.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.noData}>No tienes tambos registrados.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {tambos.map((tambo) => {
                        // Calcular valores para la UI basados en última medición
                        const ithValue = tambo.lastMedicion ? Number(tambo.lastMedicion.indice) || 0 : 0;

                        // ¿La última medición es de hoy?
                        let hasDataToday = false;
                        if (tambo.lastMedicion && tambo.lastMedicion.date) {
                            const d = new Date(tambo.lastMedicion.date);
                            const now = new Date();
                            hasDataToday =
                                d.getFullYear() === now.getFullYear() &&
                                d.getMonth() === now.getMonth() &&
                                d.getDate() === now.getDate();
                        }

                        const stressInfo = getStressLevel(ithValue);

                        // Determinar si el sistema está APAGADO para anular el color
                        // Asumimos OFF si estado es 0 o 10.
                        const estado = tambo.lastMedicion ? tambo.lastMedicion.estado : null;
                        const isOff = estado === 0 || estado === 10;
                        // const isSystemOn = estado === ESTADO_SISTEMA.ON || (!isOff && estado !== null); // Simplificación, ajustamos visual

                        // Si no hay datos de hoy o está apagado, usar gris y no mostrar estrés crítico.
                        const cardColor = (!hasDataToday || isOff) ? '#828588' : stressInfo.color;

                        // Calcular colores derivados: texto contrastado y fondo tintado para la caja ITH
                        // User requested: Value and Stress Text should ALWAYS use the main Stress Color
                        // irrespective of data date or system status.

                        // Force using the stress color for the TEXT elements as requested
                        const contentColor = stressInfo.color;

                        // We also want the background tint to match the stress color
                        const ithBoxBackground = hexToRgba(stressInfo.color, ITH_TINT_ALPHA);

                        return (
                            <TouchableHighlight
                                key={tambo.id}
                                onPress={() => navigate(`/tambo/${tambo.id}`)}
                                style={[styles.card, { borderLeftColor: cardColor }]}
                                underlayColor="#4db14f40" // Green with ~25% opacity
                                activeOpacity={0.9}
                            >
                                <View>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.tamboName}>{tambo.nombreTambo}</Text>
                                        {tambo.lastMedicion && hasDataToday && (
                                            <View style={[styles.badge, { backgroundColor: cardColor }]}>
                                                <Text style={styles.badgeText}>{stressInfo.label}</Text>
                                            </View>
                                        )}
                                    </View>

                                    {tambo.lastMedicion ? (
                                        <View style={styles.cardBodyNew}>
                                            {/* ITH */}
                                            <View style={[styles.ithBox, { backgroundColor: ithBoxBackground, padding: 10, borderRadius: 10 }]}>
                                                <Text style={[styles.ithLabel, { color: '#101010ff' }]}>ITH</Text>
                                                <Text style={[styles.ithValue, { color: contentColor }]}>
                                                    {ithValue}
                                                </Text>
                                                <Text style={[styles.ithStress, { color: contentColor }]}>{stressInfo.label}</Text>
                                            </View>

                                            {/* Info */}
                                            <View style={styles.detailsBox}>
                                                <View style={styles.row}>
                                                </View>

                                                {tambo.lastActivation && (
                                                    <View style={{ alignItems: 'flex-start', marginTop: 5 }}>
                                                        <Text style={[styles.timeText, { marginBottom: 2 }]}>
                                                            🌡️ Última act.
                                                        </Text>
                                                        <Text style={[styles.timeText, { fontWeight: 'bold', marginTop: 0 }]}>
                                                            {formatDate(tambo.lastActivation)}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>

                                    ) : (
                                        <Text style={styles.noMedicionText}>Sin datos registrados</Text>
                                    )}
                                </View>
                            </TouchableHighlight>
                        );
                    })}
                </ScrollView>
            )}

            <TouchableOpacity
                onPress={() => navigate("/configuracion")}
                activeOpacity={0.8}
                style={styles.configButtonWrapper}
            >
                <View style={styles.configButton}>
                    <Text style={styles.configButtonText}>Configuración</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.footer}>
                <View style={{ marginTop: 5 }}>
                    <Text style={styles.textVersion}>Farmerin Division S.A. - &copy; 2020</Text>
                    <Text style={styles.textVersion}>Developed by Facundo Peralta & Farmerin Team</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
        paddingTop: 45 // Safe area top adjustment
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
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "white",
        borderRadius: 15,
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
        textAlign: 'center',
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
    cardBodyNew: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    ithBox: {
        flex: 1,
    },

    ithLabel: {
        fontSize: 12,
        color: "#888",
        textAlign: 'center',
    },

    ithValue: {
        fontSize: 40,
        fontWeight: "bold",
        lineHeight: 44,
        textAlign: 'center',
    },

    ithStress: {
        fontSize: 13,
        color: "#666",
        textAlign: 'center',
    },

    detailsBox: {
        flex: 1,
        alignItems: "center",
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },

    rowText: {
        fontSize: 13,
        color: "#555",
    },

    bold: {
        fontWeight: "600",
        color: "#333",
    },

    timeText: {
        fontSize: 12,
        textAlign: 'center',
        display: 'flex',
        color: "#777",
        marginTop: 6,
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
    infoLabel: {
        fontWeight: "600",
        color: "#444",
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
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: "center",
        borderTopWidth: 0,
        backgroundColor: '#f4f4f9' // Transparent/Background color
    },
    configButtonWrapper: {
        marginHorizontal: 20,
        marginBottom: 10
    },
    configButton: {
        backgroundColor: '#297fba',
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    configButtonText: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
    textVersion: {
        color: "#888",
        fontSize: 10,
        textAlign: "center",
        marginTop: 2
    }
});
