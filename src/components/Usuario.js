import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from "react-native";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-native";
import Svg, { Path } from "react-native-svg";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { getStressLevel } from "../utils/ithLogic";

// Icono personalizado de granjero (equivalente de GiFarmer de game-icons.net)
const FarmerIcon = ({ size = 24, color = "#000", style }) => (
    <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
        <Path
            fill={color}
            d="M379.42 24.066l-28.059 87.407 28.268 5.941-3.098 15.352-52.25 47.843-51.5-43.125-23.404-4.093c8.217-14.33 14.683-32.77 16.404-49.594 10.02-2.28 34.92-5.675 46.094-10.059-4.997-10.285-30.197-16.906-48.7-16.316-1.733-20.713-8.88-29.054-34.155-27.902-25.276 1.151-32.972 6.601-30.16 36.423-18.866 4.127-38.097 12.616-39.74 27.084 7.87-.307 32.96-2.896 40.724-3.011.66 14.1 4.4 27.847 9.97 36.375l-35.158-6.125L106 195.922l77.344 55.875 1.625 16.844-34.19 215.75h38.375l38.315-169.25 47.873 169.25h37.47l-3.564-16.407 17.094 16.407 63.062-322.532c5.01-4.54 9.265-8.481 12.094-11.312.177-10.537-2.537-18.942-5.094-24.5l.971-4.902 27.238 5.724 8.444-93.117-22.846 68.781-10.848-2.256 6.635-72.658-21.568 69.55-11.217-2.333 6.207-70.77zM406 27.62l.002-.01h-.002v.01zM182.844 153.39l.344 64.095-31.5-23.75 31.156-40.345zm88.031 21.252 50.875 45.937s22.993-19.456 44.875-38.531L309.187 467.61l-42.812-197.529 4.5-95.44z"
        />
    </Svg>
);

export default function Usuario({ onBack }) {
    const { currentUser } = useAuth();
    const [tambos, setTambos] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) return;

        const tambosRef = ref(db, "tambos");
        const unsubscribe = onValue(tambosRef, (snapshot) => {
            const data = snapshot.val();
            const userTambos = [];

            if (data) {
                Object.keys(data).forEach((key) => {
                    const tamboData = data[key];
                    // Filtrar por UID del usuario actual (verificación de clave)
                    if (tamboData.usuario && tamboData.usuario[currentUser.uid] !== undefined) {

                        // Analizar la última medición para el estado
                        let latestMedicion = null;
                        if (tamboData.mediciones_ith) {
                            const sortedKeys = Object.keys(tamboData.mediciones_ith).sort();
                            if (sortedKeys.length > 0) {
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
                            }
                        }

                        userTambos.push({
                            id: key,
                            nombre: key.replace(/_/g, ' '),
                            latestMedicion
                        });
                    }
                });
            }
            setTambos(userTambos);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    // Funcion de boton volver atras
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <View style={styles.container}>

            {/* 1. Título del encabezado (estilo Ayuda.js) */}
            <Text style={styles.headerTitle}>Usuario</Text>

            {/* 2. Botón de retroceso de ancho completo con Ionicons (Restaurado) */}
            <TouchableOpacity onPress={handleBack} style={styles.fullWidthBackButton}>
                <Ionicons name="arrow-back" size={20} color="#297eba" style={{ marginRight: 8 }} />
                <Text style={styles.backButtonText}>Atras</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Encabezado del perfil */}
                <View style={styles.profileHeader}>
                    <View style={styles.profileIconContainer}>
                        {/* Usando el icono de granjero aquí también */}
                        <FarmerIcon size={40} color="#fff" />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>
                            {currentUser?.displayName || "Usuario Farmerin"}
                        </Text>
                        <Text style={styles.userEmail}>{currentUser?.email}</Text>
                        {/* Insignia de rol eliminada según lo solicitado */}
                    </View>
                </View>

                {/* Sección de establecimientos */}
                <View style={styles.sectionContainer}>
                    <Text style={styles.sectionTitle}>Mis Tambos</Text>

                    {loading ? (
                        <ActivityIndicator size="large" color="#297eba" style={{ marginTop: 20 }} />
                    ) : (
                        <View style={styles.listContainer}>
                            {tambos.length > 0 ? (
                                tambos.map((tambo) => {
                                    // Calcular estado
                                    const ithValue = tambo.latestMedicion ? Number(tambo.latestMedicion.indice) || 0 : 0;
                                    const stressInfo = getStressLevel(ithValue);
                                    const hasData = !!tambo.latestMedicion;

                                    return (
                                        // Cambiado de TouchableOpacity a View (Solo lectura)
                                        <View
                                            key={tambo.id}
                                            style={[styles.tamboCard, { borderLeftColor: hasData ? stressInfo.color : '#ccc' }]}
                                        >
                                            <View style={styles.cardContent}>
                                                <View style={styles.cardMain}>
                                                    <View style={styles.iconWrapper}>
                                                        <FontAwesome5 name="warehouse" size={18} color="#555" />
                                                    </View>
                                                    <Text style={styles.tamboName}>{tambo.nombre}</Text>
                                                </View>

                                                {/* Indicador de estado */}
                                                <View style={styles.statusContainer}>
                                                    {hasData ? (
                                                        <>
                                                            <View style={[styles.statusBadge, { backgroundColor: stressInfo.color }]}>
                                                                <Text style={styles.statusText}>ITH {ithValue.toFixed(1)}</Text>
                                                            </View>
                                                            <Text style={styles.statusLabel}>{stressInfo.label}</Text>
                                                        </>
                                                    ) : (
                                                        <Text style={styles.noDataText}>Sin datos recientes</Text>
                                                    )}
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })
                            ) : (
                                <View style={styles.emptyState}>
                                    <Ionicons name="leaf-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyText}>No tienes tambos asociados.</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
                <View style={styles.footerContainer}>
                    <Image
                        source={require('../../assets/logolargo2.png')}
                        style={styles.footerLogo}
                        resizeMode="contain"
                    />
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
        paddingTop: 45 // Zona segura
    },
    // Estilo de título de encabezado de Ayuda.js
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 10, // Margen ajustado entre título y botón de retroceso
        backgroundColor: '#4db14f',
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
    // Nuevo estilo de botón de retroceso de ancho completo
    fullWidthBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Centrar texto
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
    content: {
        paddingHorizontal: 20,
        paddingBottom: 40
    },
    // Estilos de encabezado de perfil
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 25,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    profileIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#4db14f', // Estilo verde según lo solicitado
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#e1e1e1'
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 2
    },
    userEmail: {
        fontSize: 14,
        color: "#666",
        marginBottom: 6
    },
    // Estilo de insignia de rol eliminado
    // Estilos de sección
    sectionContainer: {
        flex: 1
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#2c3e50",
        marginBottom: 2,
        marginLeft: 5
    },
    sectionSubtitle: {
        fontSize: 14,
        color: "#7f8c8d",
        marginBottom: 15,
        marginLeft: 5
    },
    listContainer: {
        gap: 12
    },
    tamboCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 5,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardMain: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },
    iconWrapper: {
        marginRight: 8,
        width: 24,
        alignItems: 'center'
    },
    tamboName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333"
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 32
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginRight: 8
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold'
    },
    statusLabel: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic'
    },
    noDataText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic'
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        opacity: 0.6
    },
    emptyText: {
        marginTop: 10,
        color: '#666',
        fontSize: 16
    },
    footerContainer: {
        alignItems: 'center',
        marginTop: -50,
        marginBottom: 70
    },
    footerLogo: {
        width: 250,
        height: 255,
        opacity: 0.8
    },
});
