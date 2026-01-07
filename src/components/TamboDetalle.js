import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-native";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView, Modal, useWindowDimensions } from "react-native";
import AdvancedITHChart, { ESTADOS_LABEL } from "./AdvancedITHChart";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getStressLevel, ITH_RANGES } from "../utils/ithLogic";
import * as ScreenOrientation from 'expo-screen-orientation';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';


const FILTER_OPTIONS = [
    { label: 'MIN', val: 'MIN', color: '#2196F3' },
    { label: 'MED', val: 'MED', color: '#4CAF50' },
    { label: 'MAX', val: 'MAX', color: '#F44336' },
    { label: 'LLUVIA', val: 'LLUVIA', color: '#607D8B' }, // BlueGrey
    { label: 'MANUAL', val: 'MANUAL', color: '#9C27B0' }
];

export default function TamboDetalle() {
    // Obtener el ID del tambo de la URL
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado para almacenar todas las mediciones crudas de Firebase
    const [allMediciones, setAllMediciones] = useState([]);
    // Estado para almacenar las mediciones filtradas por fecha
    const [filteredData, setFilteredData] = useState([]);
    // Estado de carga
    const [loading, setLoading] = useState(true);

    // Estados para el selector de fechas
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState("start"); // 'start' o 'end'
    const [showChart, setShowChart] = useState(false);
    const [filterMode, setFilterMode] = useState('today'); // 'today', 'month', 'custom'
    const [zoomLevel, setZoomLevel] = useState(1.0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [selectedStateFilter, setSelectedStateFilter] = useState('MAX'); // Default filter: MAX
    const [showAllRecords, setShowAllRecords] = useState(false);
    const baseZoom = useRef(1.0);
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();

    // Determinar dimensiones del gráfico según modo
    // AnchoVentana - 40 (Márgenes: 20*2) - 30 (Relleno: 15*2) = AnchoVentana - 70
    const screenWidth = windowWidth - 70;
    const screenHeight = windowHeight;
    const chartHeight = isFullscreen ? screenHeight - 60 : 350;

    // --- GESTOS DE ZOOM (Pinch) ---
    const onPinchEvent = (event) => {
        if (event.nativeEvent.scale) {
            let newZoom = baseZoom.current * event.nativeEvent.scale;
            newZoom = Math.max(1.0, Math.min(newZoom, 4.0)); // Limites 1x - 4x
            setZoomLevel(newZoom);
        }
    };

    const onPinchStateChange = (event) => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            baseZoom.current = zoomLevel; // Guardar zoom actual al soltar
        }
    };

    // --- PANTALLA COMPLETA (DESHABILITADO) ---
    const toggleFullscreen = async () => {
        // COMNETADO POR AHORA
        /*
        if (isFullscreen) {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            setIsFullscreen(false);
        } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
            setIsFullscreen(true);
        }
        */
    };

    /**
     * Cambia el modo de filtro.
     * @param {string} mode - 'today', 'month', 'custom'
     */
    const handleFilterModeChange = (mode) => {
        setFilterMode(mode);
        const now = new Date();

        if (mode === 'today') {
            setStartDate(now);
            setEndDate(null);
            filterData(allMediciones, now, null);
        } else if (mode === 'month') {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último día del mes
            setStartDate(startOfMonth);
            setEndDate(endOfMonth);
            filterData(allMediciones, startOfMonth, endOfMonth);
        } else if (mode === 'custom') {
            // No filtrar inmediatamente, dejar que el usuario elija fechas.
            // Mantener las fechas actuales o resetear si se prefiere.
            setShowDatePicker(false); // Asegurar que no se abra solo
        }
    };

    /**
     * Efecto para suscribirse a los datos del tambo en Firebase.
     * Se ejecuta cuando cambia el 'id'.
     */
    useEffect(() => {
        const medicionesRef = ref(db, `tambos/${id}/mediciones_ith`);

        // Escuchar cambios en tiempo real
        const unsubscribe = onValue(medicionesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convertir el objeto de objetos a un array y parsear fechas
                const dataArray = Object.keys(data).map(key => {
                    const item = data[key];
                    return {
                        id: key,
                        // Normalizar claves a minúsculas para consistencia (Firebase puede tener Indice o indice)
                        date: item.Date || item.date,
                        estado: item.Estado !== undefined ? item.Estado : item.estado,
                        humedad: item.Humedad !== undefined ? item.Humedad : item.humedad,
                        indice: item.Indice !== undefined ? item.Indice : item.indice,
                        temperatura: item.Temperatura !== undefined ? item.Temperatura : item.temperatura,
                        parsedDate: new Date(item.Date || item.date)
                    };
                });
                // Ordenar por fecha ascendente para el gráfico
                dataArray.sort((a, b) => a.parsedDate - b.parsedDate);
                setAllMediciones(dataArray);

                setAllMediciones(dataArray);

                // Filtrar automáticamente para el día de hoy al cargar
                handleFilterModeChange('today');
            } else {
                setAllMediciones([]);
            }
            setLoading(false);
        });

        // Limpiar suscripción al desmontar
        return unsubscribe;
    }, [id]);

    /**
     * Filtra las mediciones según un rango de fechas.
     * @param {Array} data - Array de todas las mediciones.
     * @param {Date} start - Fecha de inicio.
     * @param {Date} [end] - Fecha de fin (opcional).
     */
    const filterData = (data, start, end = null) => {
        if (!start) return;

        // Configurar inicio del día (00:00:00)
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);

        // Configurar fin del día (23:59:59)
        const e = new Date(end || start);
        e.setHours(23, 59, 59, 999);

        console.log(`Filtrando datos desde ${s.toLocaleString()} hasta ${e.toLocaleString()}`);

        const filtered = data.filter(m => {
            const mDate = m.parsedDate;
            return mDate >= s && mDate <= e;
        });

        setFilteredData(filtered);
        setShowChart(true);
    };

    /**
     * Maneja el cambio de fecha desde el selector (DateTimePicker).
     * @param {Object} event - Evento del selector.
     * @param {Date} selectedDate - Fecha seleccionada.
     */
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            let newStart = startDate;
            let newEnd = endDate;

            if (datePickerMode === "start") {
                newStart = selectedDate;
                setStartDate(selectedDate);
                // Si la nueva fecha de inicio es mayor que el fin, resetear fin
                if (endDate && selectedDate > endDate) {
                    newEnd = null;
                    setEndDate(null);
                }
            } else {
                newEnd = selectedDate;
                setEndDate(selectedDate);
            }

            // Actualizar gráfico automáticamente al seleccionar fecha
            filterData(allMediciones, newStart, newEnd);
        }
    };

    /**
     * Abre el selector de fecha.
     * @param {string} mode - 'start' para fecha inicio, 'end' para fecha fin via ref si se implementara rango.
     */
    const openDatePicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    // Formatear fecha para mostrar en UI
    const formatDate = (date) => date.toLocaleDateString();

    /**
     * Renderiza el gráfico combinado avanzado.
     */
    const chartData = React.useMemo(() => {
        if (filteredData.length === 0) return null;

        // Filtrar datos inválidos
        let validData = filteredData.filter(m => {
            const temp = parseFloat(m.temperatura);
            const hum = parseFloat(m.humedad);
            const ith = parseFloat(m.indice);
            return !isNaN(temp) && !isNaN(hum) && !isNaN(ith);
        });

        if (validData.length === 0) return [];

        const MAX_POINTS = 100;
        if (validData.length > MAX_POINTS) {
            const step = Math.ceil(validData.length / MAX_POINTS);
            validData = validData.filter((_, i) => i % step === 0);
        }
        return validData;
    }, [filteredData]);

    const renderChart = () => {
        if (!showChart || !chartData) {
            return <Text style={styles.noData}>No hay datos para el rango seleccionado.</Text>;
        }
        if (chartData.length === 0) {
            return <Text style={styles.noData}>No hay datos válidos para mostrar.</Text>;
        }

        // RENDERIZADO SIN ZOOM NI GESTOS
        return (
            <View style={[styles.chartWrapper, isFullscreen && { width: windowWidth, height: windowHeight }]}>
                <AdvancedITHChart
                    data={chartData}
                    width={isFullscreen ? windowWidth : screenWidth}
                    height={chartHeight}
                    zoomLevel={1.0} // Zoom fijo en 1.0
                />
            </View>
        );
    };

    if (isFullscreen) {
        return (
            <View style={{ flex: 1, backgroundColor: 'white' }}>
                <TouchableOpacity
                    style={{ position: 'absolute', top: 20, right: 20, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 }}
                    onPress={toggleFullscreen}
                >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Salir</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    {renderChart()}
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.paddedContent}>
                <Text style={styles.title}>{id.replace(/_/g, ' ')} </Text>
                <Text style={styles.subTitle}>Índice de temperatura-humedad</Text>
                <TouchableOpacity
                    onPress={() => navigate("/home")}
                    activeOpacity={0.7}
                >
                    <View style={styles.backButton}>
                        <Text style={styles.backButtonIcon}>‹</Text>
                        <Text style={styles.backButtonText}>Volver</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.filterContainer}>
                    <Text style={styles.sectionTitle}>Filtro de Fecha</Text>

                    {/* Botones de Filtro Rápido */}
                    <View style={styles.filterButtonsRow}>
                        <TouchableOpacity
                            style={[styles.filterBtn, filterMode === 'today' && styles.filterBtnActive]}
                            onPress={() => handleFilterModeChange('today')}
                        >
                            <Text style={[styles.filterBtnText, filterMode === 'today' && styles.filterBtnTextActive]}>Hoy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterBtn, filterMode === 'month' && styles.filterBtnActive]}
                            onPress={() => handleFilterModeChange('month')}
                        >
                            <Text style={[styles.filterBtnText, filterMode === 'month' && styles.filterBtnTextActive]}>Mes</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterBtn, filterMode === 'custom' && styles.filterBtnActive]}
                            onPress={() => handleFilterModeChange('custom')}
                        >
                            <Text style={[styles.filterBtnText, filterMode === 'custom' && styles.filterBtnTextActive]}>Rango</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selectores de Fecha (Solo visible en modo Custom) */}
                    {filterMode === 'custom' && (
                        <View style={styles.dateRow}>
                            <TouchableOpacity onPress={() => openDatePicker("start")} style={styles.dateButton}>
                                <Text>Desde: {formatDate(startDate)}</Text>
                            </TouchableOpacity>
                            <Text style={{ marginHorizontal: 10 }}> - </Text>
                            <TouchableOpacity onPress={() => openDatePicker("end")} style={styles.dateButton}>
                                <Text>Hasta: {endDate ? formatDate(endDate) : '...'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {showDatePicker && (
                        <DateTimePicker
                            value={datePickerMode === "start" ? startDate : (endDate || startDate)}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()} // Restringir a hoy o antes
                        />
                    )}
                </View>
            </View>

            <View style={styles.chartSection}>
                <Text style={styles.sectionTitle}>Grafico de ITH</Text>

                {/* LEYENDA FIJA */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>ITH</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: '#F44336' }]} />
                        <Text style={styles.legendText}>Temp</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: '#2196F3' }]} />
                        <Text style={styles.legendText}>Hum</Text>
                    </View>
                </View>

                {/* Renderizar gráfico */}
                {renderChart()}
            </View>

            {/* SECCIÓN DE LISTA DE DATOS */}
            <View style={styles.listSection}>
                <View style={styles.paddedContent}>
                    <Text style={styles.sectionTitle}>Registros Detallados</Text>

                    {/* Botones de filtro para la lista */}
                    <View style={styles.stateFilterRow}>
                        {FILTER_OPTIONS.map((f) => (
                            <TouchableOpacity
                                key={f.val}
                                style={[
                                    styles.stateFilterBtn,
                                    selectedStateFilter === f.val && { backgroundColor: f.color, borderColor: f.color }
                                ]}
                                onPress={() => setSelectedStateFilter(prev => prev === f.val ? null : f.val)}
                            >
                                <Text style={[
                                    styles.stateFilterText,
                                    selectedStateFilter === f.val ? { color: '#fff' } : { color: f.color }
                                ]}>{f.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {(() => {
                    // Lógica para determinar qué datos mostrar
                    let displayData = [];

                    if (selectedStateFilter) {
                        // FILTRADO ACTIVO: Buscar en TODO el conjunto de datos (filteredData)
                        // Definir códigos de filtro basados en la selección
                        let targetCodes = [];
                        if (selectedStateFilter === 'MIN') targetCodes = [1, 11];
                        else if (selectedStateFilter === 'MED') targetCodes = [2, 12];
                        else if (selectedStateFilter === 'MAX') targetCodes = [3, 13];
                        else if (selectedStateFilter === 'LLUVIA') targetCodes = [4];
                        else if (selectedStateFilter === 'MANUAL') targetCodes = [5];

                        // Filtrar e invertir para mostrar
                        displayData = filteredData
                            .filter(d => targetCodes.includes(d.estado))
                            .sort((a, b) => b.parsedDate - a.parsedDate); // El más reciente primero
                    } else {
                        // SIN FILTRO: Mostrar los datos del gráfico (ya procesados/submuestreados)
                        // Simplemente invertir para la lista
                        displayData = chartData ? [...chartData].reverse() : [];
                    }

                    // Lógica de LÍMITE
                    const INITIAL_LIMIT = 5;
                    const limit = showAllRecords ? 100 : INITIAL_LIMIT;
                    const slicedData = displayData.slice(0, limit);
                    const hasMore = displayData.length > INITIAL_LIMIT;

                    if (slicedData.length === 0) {
                        return <Text style={[styles.noData, { marginBottom: 20 }]}>No hay registros para mostrar {selectedStateFilter ? `con filtro ${selectedStateFilter}` : ''}</Text>;
                    }

                    return (
                        <>
                            {slicedData.map((item, index) => {
                                const timeLabel = item.parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                const dateLabel = item.parsedDate.toLocaleDateString();
                                const labelEstado = ESTADOS_LABEL[item.estado] || 'Desconocido';

                                // Determinar colores (Lógica de copiar y pegar)
                                const ithVal = parseFloat(item.indice);
                                let ithColor = 'black';
                                if (ithVal < 68) ithColor = '#4CAF50';
                                else if (ithVal < 72) ithColor = '#cedf3aff';
                                else if (ithVal < 80) ithColor = '#caba2eff';
                                else if (ithVal < 90) ithColor = '#FF9800';
                                else ithColor = '#F44336';

                                const tempVal = parseFloat(item.temperatura);
                                let tempColor = 'black';
                                if (tempVal < 20) tempColor = '#2196F3';
                                else if (tempVal < 30) tempColor = '#4CAF50';
                                else if (tempVal < 36) tempColor = '#FF9800';
                                else tempColor = '#F44336';

                                const activeFilterOption = FILTER_OPTIONS.find(f => f.val === selectedStateFilter);
                                const borderColor = activeFilterOption ? activeFilterOption.color : '#007bff';

                                return (
                                    <View key={item.id || `${index}-${selectedStateFilter}`} style={[styles.listItem, { borderLeftColor: borderColor }]}>
                                        <View style={styles.listHeader}>
                                            <Text style={styles.listDate}>{dateLabel} <Text style={styles.listTime}>{timeLabel}</Text></Text>
                                            <Text style={styles.listState}>{labelEstado}</Text>
                                        </View>
                                        <View style={styles.listDetails}>
                                            <Text style={styles.detailText}>ITH: <Text style={{ fontWeight: 'bold', color: ithColor }}>{Math.round(item.indice)}</Text></Text>
                                            <Text style={styles.detailText}>Temp: <Text style={{ fontWeight: 'bold', color: tempColor }}>{Math.round(item.temperatura)}°</Text></Text>
                                            <Text style={styles.detailText}>Hum: <Text style={{ fontWeight: 'bold', color: '#2196F3' }}>{Math.round(item.humedad)}%</Text></Text>
                                        </View>
                                    </View>
                                );
                            })}

                            {hasMore && (
                                <TouchableOpacity
                                    style={styles.showMoreButton}
                                    onPress={() => setShowAllRecords(!showAllRecords)}
                                >
                                    <Text style={styles.showMoreButtonText}>{showAllRecords ? "Ver menos" : "Ver más"}</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    );
                })()}
            </View>

            <View style={{ height: 50 }} />
        </ScrollView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f4f4f9",
    },
    paddedContent: {
        paddingHorizontal: 20,
    },
    chartSection: {
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 20,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 5,
        backgroundColor: '#4db14f',
        padding: 10,
        marginTop: 60, // El relleno superior se movió aquí
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    subTitle: {
        fontSize: 18,
        fontWeight: "normal",
        textAlign: "center",
        marginBottom: 15,
        backgroundColor: '#4db14f',
        padding: 8,
        borderWidth: 1,
        borderColor: 'black',
        borderRadius: 15,
        overflow: 'hidden',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Contenido centrado
        backgroundColor: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 15,
        // alignSelf: 'flex-start', // Eliminado para seguir el ancho completo
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
    },
    backButtonIcon: {
        fontSize: 24,
        color: '#297fba',
        marginRight: 5,
        marginTop: -4,
        fontWeight: '300'
    },
    backButtonText: {
        color: "#297fba",
        fontSize: 16,
        fontWeight: "600",
    },
    filterContainer: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 15,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        backgroundColor: '#297fba',
        padding: 10,
        borderWidth: 1,
        borderColor: 'black',
        textAlign: 'center',
        borderRadius: 15,
        overflow: 'hidden',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1
    },
    filterButtonsRow: {
        flexDirection: 'row',
        marginBottom: 15,
        justifyContent: 'space-between'
    },
    filterBtn: {
        flex: 1,
        padding: 10,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        marginHorizontal: 5,
        borderRadius: 15
    },
    filterBtnActive: {
        backgroundColor: '#297fba',
    },
    filterBtnText: {
        color: '#333',
        fontWeight: '500'
    },
    filterBtnTextActive: {
        color: '#fff',
        fontWeight: 'bold'
    },
    // Nuevos estilos para el filtro de estado
    stateFilterRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        flexWrap: 'wrap'
    },
    stateFilterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        marginBottom: 5,
        backgroundColor: '#fff',
        minWidth: 60,
        alignItems: 'center'
    },
    stateFilterText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    dateRow: {
        flexDirection: "row",
        alignItems: 'center',
        marginTop: 10
    },
    dateButton: {
        padding: 10,
        backgroundColor: "#e9ecef",
        borderRadius: 15,
        flex: 1,
        alignItems: 'center'
    },
    chartContainer: {
        // Eliminado para permitir control separado
    },
    chartControlRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 15,
        marginRight: 5
    },
    legendText: {
        fontSize: 12,
        color: '#666'
    },
    chartWrapper: {
        alignItems: 'center',
        marginVertical: 0, // Ajustar
    },
    noData: {
        textAlign: "center",
        color: "#666",
        marginTop: 20,
    },
    listSection: {
        marginTop: 10,
    },
    listItem: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginBottom: 10,
        padding: 15,
        borderRadius: 15,
        elevation: 1,
        borderLeftWidth: 5,
        borderLeftColor: '#007bff' // Acento predeterminado
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5
    },
    listDate: {
        fontSize: 14,
        color: '#555',
        fontWeight: 'bold'
    },
    listTime: {
        fontSize: 14,
        color: '#333',
        marginLeft: 10
    },
    listState: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        backgroundColor: '#eee',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 15
    },
    listDetails: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 5
    },
    detailText: {
        fontSize: 14,
        color: '#333'
    },
    showMoreButton: {
        backgroundColor: '#297eba',
        padding: 10,
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
        alignSelf: 'center',
        width: '40%',
        elevation: 2
    },
    showMoreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14
    }
});
