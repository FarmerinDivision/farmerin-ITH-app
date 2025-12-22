import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-native";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView } from "react-native";
import { LineChart } from "react-native-chart-kit";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getStressLevel, ITH_RANGES } from "../utils/ithLogic";
import ComplianceLog from "./ComplianceLog";

export default function TamboDetalle() {
    const { id } = useParams();
    const [allMediciones, setAllMediciones] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerMode, setDatePickerMode] = useState("start");
    const [showChart, setShowChart] = useState(false);

    useEffect(() => {
        const medicionesRef = ref(db, `tambos/${id}/mediciones_ith`);
        const unsubscribe = onValue(medicionesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const dataArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key],
                    parsedDate: new Date(data[key].Date || data[key].date)
                }));
                // Sort by date initially
                dataArray.sort((a, b) => a.parsedDate - b.parsedDate);
                setAllMediciones(dataArray);

                // Auto-filter for today on load
                filterData(dataArray, new Date());
            } else {
                setAllMediciones([]);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, [id]);

    const filterData = (data, start, end = null) => {
        if (!start) return;
        const s = new Date(start); s.setHours(0, 0, 0, 0);
        const e = new Date(end || start); e.setHours(23, 59, 59, 999);

        const filtered = data.filter(m => m.parsedDate >= s && m.parsedDate <= e);
        setFilteredData(filtered);
        setShowChart(true);
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
            let newStart = startDate;
            let newEnd = endDate;

            if (datePickerMode === "start") {
                newStart = selectedDate;
                setStartDate(selectedDate);
                if (endDate && selectedDate > endDate) {
                    newEnd = null;
                    setEndDate(null);
                }
            } else {
                newEnd = selectedDate;
                setEndDate(selectedDate);
            }

            // Auto update chart on date selection
            filterData(allMediciones, newStart, newEnd);
        }
    };

    const openDatePicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    };

    const formatDate = (date) => date.toLocaleDateString();

    const renderChart = () => {
        if (!showChart || filteredData.length === 0) {
            return <Text style={styles.noData}>No hay datos para el rango seleccionado.</Text>;
        }

        const screenWidth = Dimensions.get("window").width - 40;
        const chartHeight = 300;

        // Prepare Data
        const indices = filteredData.map(m => m.indice);
        const labels = filteredData.map((m, i) => {
            // Show label every n points to avoid clutter
            const date = m.parsedDate;
            return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        });

        // Thicken labels
        const finalLabels = labels.length > 6 ? labels.map((l, i) => i % Math.ceil(labels.length / 6) === 0 ? l : "") : labels;

        // Custom Decorator for Critical Period (15:00 - 17:00)
        // This is tricky in chart-kit, so we will use data points coloring or vertical lines.
        // We will just color the line red? No, line color is single.
        // We can color the DOTS.

        const getDotColor = (dataPoint, index) => {
            const m = filteredData[index];
            const h = m.parsedDate.getHours();
            // Critical period 15 to 17
            if (h >= 15 && h < 17) return "red";

            // Or color based on Stress Level
            return getStressLevel(dataPoint).color;
        };

        return (
            <View style={{ position: 'relative' }}>
                {/* Visual Risk Bands (Background) - Absolute positioned */}
                {/* Assuming Y Axis 50 to 100. Height 220 (approx chart area) */}
                {/* This is a visual approximation. Real impl needs easier chart lib for bands. */}

                <LineChart
                    data={{
                        labels: finalLabels,
                        datasets: [{ data: indices }]
                    }}
                    width={screenWidth}
                    height={chartHeight}
                    yAxisInterval={1}
                    minConfig={{ min: 50, max: 100 }}
                    fromZero={false}
                    chartConfig={{
                        backgroundColor: "#fff",
                        backgroundGradientFrom: "#fff",
                        backgroundGradientTo: "#fff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        propsForDots: { r: "5", strokeWidth: "1", stroke: "#fff" },
                        fillShadowGradientFrom: "#fff",
                        fillShadowGradientTo: "#fff",
                    }}
                    getDotColor={getDotColor}
                    bezier
                    style={styles.chart}
                />

                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: 'red' }]} /><Text style={styles.legendText}>15:00-17:00 / Alto Riesgo</Text></View>
                    <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: ITH_RANGES.NO_STRESS.color }]} /><Text style={styles.legendText}>Normal</Text></View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Monitor ITH</Text>
            <Link to="/home" style={styles.backLink}>
                <Text style={styles.linkText}>← Volver</Text>
            </Link>

            <View style={styles.filterContainer}>
                <Text style={styles.sectionTitle}>Filtro de Fecha</Text>
                <View style={styles.dateRow}>
                    <TouchableOpacity onPress={() => openDatePicker("start")} style={styles.dateButton}>
                        <Text>Desde: {formatDate(startDate)}</Text>
                    </TouchableOpacity>
                    {/* Optional End Date */}
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={datePickerMode === "start" ? startDate : (endDate || startDate)}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                    />
                )}
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.sectionTitle}>Evolución ITH (24h)</Text>
                {renderChart()}
            </View>

            <ComplianceLog mediciones={filteredData} />

            <View style={{ height: 50 }} />
        </ScrollView>
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
        marginBottom: 10,
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
        alignItems: 'center'
    },
    dateButton: {
        padding: 10,
        backgroundColor: "#e9ecef",
        borderRadius: 5,
        flex: 1
    },
    chartContainer: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        elevation: 2,
        marginBottom: 20,
        minHeight: 350
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
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5
    },
    legendText: {
        fontSize: 12,
        color: '#666'
    }
});
