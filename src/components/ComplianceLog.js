import React, { useMemo } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { ESTADO_SISTEMA } from "../models/medicionITH";

export default function ComplianceLog({ mediciones }) {

    const logs = useMemo(() => {
        if (!mediciones || mediciones.length === 0) return [];

        // Sort by date ascending to process chronologically
        const sorted = [...mediciones].sort((a, b) => new Date(a.date || a.parsedDate) - new Date(b.date || b.parsedDate));
        const events = [];

        let onStart = null;

        for (let i = 0; i < sorted.length; i++) {
            const m = sorted[i];
            const isOn = m.estado === ESTADO_SISTEMA.ON;
            const mDate = new Date(m.date || m.parsedDate);

            if (isOn) {
                if (!onStart) {
                    onStart = { date: mDate };
                }
            } else {
                // OFF state
                if (onStart) {
                    // Transition from ON to OFF -> End of Wet Cycle
                    const wetDuration = (mDate - onStart.date) / 1000;

                    // Now estimate Dry Duration
                    // Dry duration is from NOW (OFF start) until NEXT ON.
                    // We must find the next ON event.
                    let nextOnIndex = -1;
                    for (let j = i + 1; j < sorted.length; j++) {
                        if (sorted[j].estado === ESTADO_SISTEMA.ON) {
                            nextOnIndex = j;
                            break;
                        }
                    }

                    let dryEndTime = nextOnIndex !== -1
                        ? new Date(sorted[nextOnIndex].date || sorted[nextOnIndex].parsedDate)
                        : null; // If no next ON, we can't fully validate the dry cycle yet (it's ongoing)

                    let dryDuration = 0;
                    let isPending = false;

                    if (dryEndTime) {
                        dryDuration = (dryEndTime - mDate) / 1000;
                    } else {
                        // Current time or ongoing
                        isPending = true;
                        dryDuration = 0; // Or (new Date() - mDate)/1000
                    }

                    // Validation Rules
                    // Wet: 40s target (allow 30-60s)
                    // Dry: 7m target (420s) (allow 300s-600s or 5m-10m)

                    const isWetOk = wetDuration >= 30 && wetDuration <= 60;
                    const isDryOk = !isPending && (dryDuration >= 300 && dryDuration <= 600);

                    events.push({
                        id: onStart.date.toISOString(),
                        startTime: onStart.date,
                        wetDuration: wetDuration,
                        dryDuration: dryDuration,
                        isPending: isPending,
                        isValid: isWetOk && isDryOk,
                        isWetOk,
                        isDryOk
                    });

                    onStart = null;
                }
            }
        }

        return events.reverse(); // Show newest first
    }, [mediciones]);

    const renderItem = ({ item }) => {
        let statusText = "OK";
        let statusColor = "#4CAF50";

        if (item.isPending) {
            statusText = "En curso...";
            statusColor = "#FF9800";
        } else if (!item.isValid) {
            statusText = "Irregular";
            statusColor = "#F44336";
        }

        return (
            <View style={[styles.logItem, { borderLeftColor: statusColor }]}>
                <View style={styles.logInfo}>
                    <Text style={styles.logTime}>{item.startTime.toLocaleTimeString()}</Text>
                    <Text style={styles.logDetail}>
                        Mojado: {item.wetDuration.toFixed(0)}s {item.isWetOk ? "✓" : "⚠"}
                    </Text>
                    <Text style={styles.logDetail}>
                        Ventilación: {item.isPending ? "..." : item.dryDuration.toFixed(0) + "s"} {(!item.isPending && item.isDryOk) ? "✓" : (item.isPending ? "" : "⚠")}
                    </Text>
                </View>
                <View>
                    <Text style={[styles.statusTag, { color: statusColor }]}>
                        {statusText}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro de Ciclos (Mojado + Ventilación)</Text>
            <View style={styles.summary}>
                <Text style={styles.summaryText}>Objetivo: 40s AGUA + 7m AIRE</Text>
            </View>

            {logs.length === 0 ? (
                <Text style={styles.noData}>No hay ciclos registrados.</Text>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    style={styles.list}
                    nestedScrollEnabled={true}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 2
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333'
    },
    summary: {
        marginBottom: 10,
        padding: 5,
        backgroundColor: '#e3f2fd',
        borderRadius: 4
    },
    summaryText: {
        fontSize: 12,
        color: '#0d47a1',
        textAlign: 'center'
    },
    list: {
        maxHeight: 300
    },
    logItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        borderLeftWidth: 4,
        marginBottom: 8,
        backgroundColor: '#f9f9f9',
        borderRadius: 4
    },
    logInfo: {
        flex: 1
    },
    logTime: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 4
    },
    logDetail: {
        fontSize: 12,
        color: '#666'
    },
    statusTag: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 10
    },
    noData: {
        fontStyle: 'italic',
        color: '#888',
        textAlign: 'center',
        padding: 20
    }
});
