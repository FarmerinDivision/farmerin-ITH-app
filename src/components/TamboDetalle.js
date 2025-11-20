import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-native";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView, Platform } from "react-native";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";

// Componente principal que muestra los detalles de un tambo específico
export default function TamboDetalle() {
    // Obtiene el ID del tambo desde los parámetros de la URL
    const { id } = useParams();

    // Estados para almacenar los datos
    const [allMediciones, setAllMediciones] = useState([]); // Todas las mediciones recuperadas de Firebase
    const [filteredData, setFilteredData] = useState([]);   // Mediciones filtradas por fecha para mostrar en el gráfico
    const [loading, setLoading] = useState(true);           // Estado de carga

    // Estados para la selección de fechas
    const [startDate, setStartDate] = useState(new Date()); // Fecha de inicio seleccionada (por defecto hoy)
    const [endDate, setEndDate] = useState(null);           // Fecha de fin (null significa que se seleccionó un solo día)
    const [showDatePicker, setShowDatePicker] = useState(false); // Controla la visibilidad del selector de fechas
    const [datePickerMode, setDatePickerMode] = useState("start"); // Indica si se está seleccionando fecha de inicio o fin ("start" o "end")
    const [showChart, setShowChart] = useState(false);      // Controla si se debe mostrar el gráfico (solo después de actualizar)

    // useEffect: Se ejecuta al montar el componente o cuando cambia el ID
    // Se conecta a Firebase para escuchar cambios en las mediciones del tambo
    useEffect(() => {
        const medicionesRef = ref(db, `tambos/${id}/mediciones_ith`);
        const unsubscribe = onValue(medicionesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Convierte el objeto de datos de Firebase en un array y normaliza la fecha
                const dataArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    parsedDate: new Date(data[key].Date) // Asegura que el campo Date exista y sea convertible a objeto Date
                }));

                // DEBUG: Log para verificar la estructura de los datos
                if (dataArray.length > 0) {
                    console.log("Estructura de la primera medición:", JSON.stringify(dataArray[0], null, 2));
                }

                setAllMediciones(dataArray);
            } else {
                setAllMediciones([]);
            }
            setLoading(false); // Finaliza el estado de carga
        });

        // Limpia la suscripción a Firebase al desmontar el componente
        return unsubscribe;
    }, [id]);

    // Función para manejar el cambio de fecha en el selector
    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false); // Cierra el selector
        if (selectedDate) {
            if (datePickerMode === "start") {
                setStartDate(selectedDate);
                // Si la fecha de fin es anterior a la de inicio, resetea la fecha de fin
                if (endDate && selectedDate > endDate) {
                    setEndDate(null);
                }
            } else {
                setEndDate(selectedDate);
            }
            setShowChart(false); // Oculta el gráfico hasta que el usuario haga clic en "Actualizar"
        }
    };

    // Función para abrir el selector de fechas en el modo especificado
    const openDatePicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    // Función principal para filtrar los datos y actualizar el gráfico
    const updateChart = () => {
        if (!startDate) return;

        // Configura la fecha de inicio al principio del día (00:00:00)
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        let end;
        if (endDate) {
            // Si hay fecha de fin, se configura al final de ese día (23:59:59)
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Si es un solo día, la fecha de fin es el final del mismo día de inicio
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
        }

        // Filtra las mediciones que caen dentro del rango de fechas y las ordena cronológicamente
        const filtered = allMediciones.filter(m => {
            return m.parsedDate >= start && m.parsedDate <= end;
        }).sort((a, b) => a.parsedDate - b.parsedDate);

        setFilteredData(filtered);
        setShowChart(true); // Muestra el gráfico con los nuevos datos
    };

    // Función auxiliar para formatear la fecha como string local
    const formatDate = (date) => {
        return date.toLocaleDateString();
    };

    // Función que renderiza el componente del gráfico
    const renderChart = () => {
        // Si no hay datos filtrados o no se debe mostrar el gráfico, muestra un mensaje
        if (!showChart || filteredData.length === 0) {
            return <Text style={styles.noData}>No hay datos para el rango seleccionado.</Text>;
        }

        // Determina si se está mostrando un solo día para ajustar el formato del eje X
        const isSingleDay = !endDate || (startDate.toDateString() === endDate.toDateString());

        // Prepara las etiquetas del eje X
        const labels = filteredData.map(m => {
            if (isSingleDay) {
                // Si es un solo día, muestra solo la hora
                return m.parsedDate.getHours() + ":" + String(m.parsedDate.getMinutes()).padStart(2, '0');
            } else {
                // Si es un rango, muestra fecha (día/mes) y hora
                return `${m.parsedDate.getDate()}/${m.parsedDate.getMonth() + 1} ${m.parsedDate.getHours()}h`;
            }
        });

        // Optimiza las etiquetas si hay demasiados puntos para evitar superposición
        // Muestra solo 1 de cada N etiquetas (máximo ~6 etiquetas visibles)
        const finalLabels = labels.length > 6 ? labels.map((l, i) => i % Math.ceil(labels.length / 6) === 0 ? l : "") : labels;

        // Configuración de datos para el gráfico (react-native-chart-kit)
        const data = {
            labels: finalLabels,
            datasets: [
                {
                    data: filteredData.map(m => {
                        // Intenta obtener la temperatura con diferentes nombres de campo posibles
                        const temp = m.temperatura || m.Temperatura || m.temperature || m.Temperature || 0;
                        return parseFloat(temp);
                    }),
                    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // Rojo para Temperatura
                    strokeWidth: 2,
                    legend: "Temperatura"
                },
                {
                    data: filteredData.map(m => {
                        // Intenta obtener la humedad con diferentes nombres de campo posibles
                        const hum = m.humedad || m.Humedad || m.humidity || m.Humidity || 0;
                        return parseFloat(hum);
                    }),
                    color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, // Azul para Humedad
                    strokeWidth: 2,
                    legend: "Humedad"
                }
            ],
            legend: ["Temperatura", "Humedad"]
        };

        return (
            <View>
                <LineChart
                    data={data}
                    // Ancho fijo ajustado a la pantalla
                    width={Dimensions.get("window").width - 40}
                    height={300}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 1,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        style: {
                            borderRadius: 16
                        },
                        propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                            stroke: "#ffa726"
                        }
                    }}
                    bezier // Suaviza las líneas del gráfico
                    style={styles.chart}
                />
            </View>
        );
    };

    // Muestra un indicador de carga mientras se obtienen los datos iniciales
    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Cargando datos...</Text>
            </View>
        );
    }

    // Renderizado principal del componente
    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Detalle del Tambo</Text>
            <Link to="/home" style={styles.backLink}>
                <Text style={styles.linkText}>← Volver al Home</Text>
            </Link>

            <View style={styles.filterContainer}>
                <Text style={styles.sectionTitle}>Filtros</Text>

                {/* Fila de selección de fechas */}
                <View style={styles.dateRow}>
                    <View style={styles.dateInput}>
                        <Text>Desde:</Text>
                        <TouchableOpacity onPress={() => openDatePicker("start")} style={styles.dateButton}>
                            <Text>{formatDate(startDate)}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dateInput}>
                        <Text>Hasta (Opcional):</Text>
                        <TouchableOpacity onPress={() => openDatePicker("end")} style={styles.dateButton}>
                            <Text>{endDate ? formatDate(endDate) : "Solo un día"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Componente DateTimePicker (solo visible cuando showDatePicker es true) */}
                {showDatePicker && (
                    <DateTimePicker
                        value={datePickerMode === "start" ? startDate : (endDate || startDate)}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}

                {/* Botón para aplicar filtros y actualizar el gráfico */}
                <TouchableOpacity onPress={updateChart} style={styles.updateButton}>
                    <Text style={styles.updateButtonText}>Actualizar valores del gráfico</Text>
                </TouchableOpacity>
            </View>

            {/* Contenedor del gráfico */}
            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Gráfico de Mediciones</Text>
                {showChart ? renderChart() : <Text style={styles.infoText}>Selecciona fechas y actualiza para ver el gráfico.</Text>}
            </View>
        </ScrollView>
    );
}

// Estilos del componente
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
    backLink: {
        marginBottom: 20,
    },
    linkText: {
        color: "#007bff",
        fontSize: 16,
    },
    filterContainer: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },
    dateRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15,
    },
    dateInput: {
        flex: 1,
        marginRight: 10,
    },
    dateButton: {
        padding: 10,
        backgroundColor: "#e9ecef",
        borderRadius: 5,
        marginTop: 5,
        alignItems: "center",
    },
    updateButton: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 5,
        alignItems: "center",
    },
    updateButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    chartContainer: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        elevation: 2,
        marginBottom: 30,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    noData: {
        textAlign: "center",
        color: "#666",
        marginTop: 20,
    },
    infoText: {
        textAlign: "center",
        color: "#888",
        fontStyle: "italic",
        marginTop: 10,
    }
});
