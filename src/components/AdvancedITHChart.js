import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText, Circle, G } from 'react-native-svg';

const ESTADOS_COLOR = {
    0: 'rgba(76, 175, 80, 0.2)',    // APAGADO (Verde)
    10: 'rgba(76, 175, 80, 0.2)',   // APAGADO
    1: 'rgba(255, 235, 59, 0.2)',   // MINIMO (Amarillo)
    11: 'rgba(255, 235, 59, 0.2)',  // MINIMO
    2: 'rgba(255, 152, 0, 0.2)',    // MEDIO (Naranja)
    12: 'rgba(255, 152, 0, 0.2)',   // MEDIO
    3: 'rgba(244, 67, 54, 0.2)',    // MAXIMO (Rojo)
    13: 'rgba(244, 67, 54, 0.2)',   // MAXIMO
    4: 'rgba(33, 150, 243, 0.2)',   // LLUVIA (Azul)
    5: 'rgba(0, 0, 0, 0.1)',        // MANUAL (Gris)
};

export const ESTADOS_LABEL = {
    0: 'OFF', 10: 'OFF',
    1: 'MIN', 11: 'MIN',
    2: 'MED', 12: 'MED',
    3: 'MAX', 13: 'MAX',
    4: 'LLUVIA',
    5: 'MANUAL'
};

export default function AdvancedITHChart({ data, width, height, zoomLevel = 1.0 }) {
    const [tooltipIndex, setTooltipIndex] = useState(null);

    // Dimensiones y Márgenes
    const PADDING_TOP = 20;
    const PADDING_BOTTOM = 40; // Más espacio para etiquetas X
    const PADDING_LEFT = 40;  // Más espacio para etiquetas Y (0-100)
    const PADDING_RIGHT = 40; // Eje ITH derecho (referencias)

    // Ancho efectivo basado en el zoom
    const effectiveWidth = width * zoomLevel;

    const CHART_WIDTH = effectiveWidth - PADDING_LEFT - PADDING_RIGHT;
    const CHART_HEIGHT = height - PADDING_TOP - PADDING_BOTTOM;

    // --- Procesamiento de Escalas ---
    const processedData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Escala Eje Izquierdo (Temperatura 0-50)
        const scaleTemp = (val) => {
            const min = 0;
            const max = 50; // Max temp expected
            const clampedVal = Math.max(min, Math.min(max, val));
            return CHART_HEIGHT - ((clampedVal - min) / (max - min)) * CHART_HEIGHT;
        };

        // Escala Eje Derecho (Humedad e ITH 0-100)
        const scaleRight = (val) => {
            const min = 0;
            const max = 100;
            const clampedVal = Math.max(min, Math.min(max, val));
            return CHART_HEIGHT - ((clampedVal - min) / (max - min)) * CHART_HEIGHT;
        };

        // Escala Tiempo (X)
        const startTime = data[0].parsedDate.getTime();
        const endTime = data[data.length - 1].parsedDate.getTime();
        const timeRange = endTime - startTime;

        const scaleX = (date) => {
            if (timeRange === 0) return CHART_WIDTH / 2;
            const t = date.getTime();
            return ((t - startTime) / timeRange) * CHART_WIDTH;
        };

        // Generar puntos path
        let pathTemp = "";
        let pathHum = "";
        let pathIth = "";

        const points = data.map((d, i) => {
            const x = scaleX(d.parsedDate);
            const yTemp = scaleTemp(parseFloat(d.temperatura));
            const yHum = scaleRight(parseFloat(d.humedad));
            const yIth = scaleRight(parseFloat(d.indice));

            if (i === 0) {
                pathTemp += `M ${x} ${yTemp}`;
                pathHum += `M ${x} ${yHum}`;
                pathIth += `M ${x} ${yIth}`;
            } else {
                pathTemp += ` L ${x} ${yTemp}`;
                pathHum += ` L ${x} ${yHum}`;
                pathIth += ` L ${x} ${yIth}`;
            }

            return { x, yTemp, yHum, yIth, data: d };
        });

        // Generar franjas de estado (rectángulos de fondo) - OPTIMIZADO: Merging
        const stateRects = [];
        if (points.length > 1) {
            let currentRect = {
                x: points[0].x,
                width: 0,
                color: ESTADOS_COLOR[points[0].data.estado] || 'transparent'
            };

            for (let i = 0; i < points.length - 1; i++) {
                const curr = points[i];
                const next = points[i + 1];
                const w = next.x - curr.x;
                const nextColor = ESTADOS_COLOR[curr.data.estado] || 'transparent'; // Use current point's state for the interval

                if (nextColor === currentRect.color) {
                    // Mismo color, extender ancho
                    currentRect.width += w;
                } else {
                    // Color diferente, pushear actual y empezar nuevo
                    if (currentRect.width > 0) {
                        stateRects.push(currentRect);
                    }
                    currentRect = {
                        x: curr.x, // El nuevo empieza donde termina el anterior (visual continuity) roughly
                        width: w,
                        color: nextColor
                    };
                }
            }
            // Push last rect
            if (currentRect.width > 0) {
                stateRects.push(currentRect);
            }
        }

        // Generar etiquetas Eje X (Fechas)
        const xLabels = [];
        const steps = 5 * zoomLevel;
        if (timeRange > 0) {
            for (let i = 0; i <= steps; i++) {
                const fraction = i / steps;
                const t = startTime + (timeRange * fraction);
                const date = new Date(t);
                const x = fraction * CHART_WIDTH;

                // Formato Inteligente
                const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                let label = "";

                if (timeRange > 86400000) { // Mayor a 24hs -> Mostrar Mes/Dia
                    label = `${months[date.getMonth()]} ${date.getDate()}`;
                } else { // Menor a 24hs -> Mostrar Hora:Min
                    label = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                }

                xLabels.push({ x, label });
            }
        } else if (data.length > 0) {
            const d = data[0].parsedDate;
            xLabels.push({ x: CHART_WIDTH / 2, label: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}` });
        }

        return {
            points,
            pathTemp,
            pathHum,
            pathIth,
            scaleRight,
            scaleTemp,
            stateRects,
            xLabels
        };
    }, [data, width, height, zoomLevel]);

    if (!processedData) {
        return (
            <View style={[styles.container, { width, height }]}>
                <Text>No hay datos disponibles</Text>
            </View>
        );
    }

    const { points, pathTemp, pathHum, pathIth, scaleRight, scaleTemp, stateRects, xLabels } = processedData;

    // Niveles ITH Referencia
    const y68 = scaleRight(68);
    const y76 = scaleRight(76);
    const y84 = scaleRight(84);

    const handlePress = (e) => {
        const x = e.nativeEvent.locationX - PADDING_LEFT;
        // Buscar punto más cercano
        let minDist = Infinity;
        let index = -1;
        points.forEach((p, i) => {
            const dist = Math.abs(p.x - x);
            if (dist < minDist) {
                minDist = dist;
                index = i;
            }
        });
        if (minDist < 20) { // Radio de toque
            setTooltipIndex(index);
        } else {
            setTooltipIndex(null);
        }
    };

    // Eje Y Izquierdo (Temperaturas 0-50)
    const yTempTicks = [0, 10, 20, 30, 40, 50];
    // Eje Y Derecho (Humedad 0-100)
    const yHumTicks = [0, 20, 40, 60, 80, 100];

    // Contenido del Gráfico SVG
    const chartContent = (
        <Svg width={effectiveWidth} height={height} onPress={handlePress}>
            <G x={PADDING_LEFT} y={PADDING_TOP}>
                {/* --- FONDO: ESTADOS --- */}
                {stateRects.map((rect, i) => (
                    <Rect
                        key={`st-${i}`}
                        x={rect.x}
                        y={0}
                        width={rect.width}
                        height={CHART_HEIGHT}
                        fill={rect.color}
                    />
                ))}

                {/* --- EJES Y GRILLA --- */}
                {/* Grilla Eje Y Izquierdo (Temperatura) */}
                {yTempTicks.map((val) => {
                    const y = scaleTemp(val);
                    return (
                        <G key={`yt-${val}`}>
                            <Line x1={0} y1={y} x2={CHART_WIDTH} y2={y} stroke="#f0f0f0" strokeWidth={1} />
                            <SvgText
                                x={-10}
                                y={y + 4}
                                fill="#F44336"
                                fontSize="10"
                                textAnchor="end"
                            >
                                {val}°
                            </SvgText>
                        </G>
                    );
                })}

                {/* Eje Y Derecho (Humedad) */}
                {yHumTicks.map((val) => {
                    const y = scaleRight(val);
                    return (
                        <G key={`yh-${val}`}>
                            <SvgText
                                x={CHART_WIDTH + 5}
                                y={y + 4}
                                fill="#2196F3"
                                fontSize="10"
                                textAnchor="start"
                            >
                                {val}%
                            </SvgText>
                        </G>
                    );
                })}

                {/* Etiquetas Eje X (Inferior) */}
                {xLabels.map((lbl, i) => (
                    <SvgText
                        key={`x-${i}`}
                        x={lbl.x}
                        y={CHART_HEIGHT + 15}
                        fill="#666"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {lbl.label}
                    </SvgText>
                ))}

                {/* Borde del gráfico */}
                <Rect x={0} y={0} width={CHART_WIDTH} height={CHART_HEIGHT} stroke="#ccc" strokeWidth={1} fill="none" />

                {/* Líneas ITH Ref */}
                <Line x1={0} y1={y68} x2={CHART_WIDTH} y2={y68} stroke="orange" strokeDasharray="4, 4" strokeWidth={1} opacity={0.5} />
                <Line x1={0} y1={y76} x2={CHART_WIDTH} y2={y76} stroke="darkorange" strokeDasharray="4, 4" strokeWidth={1} opacity={0.5} />
                <Line x1={0} y1={y84} x2={CHART_WIDTH} y2={y84} stroke="red" strokeDasharray="4, 4" strokeWidth={1} opacity={0.5} />

                {/* --- DATOS --- */}
                {/* Humedad (Azul) */}
                <Path d={pathHum} stroke="#2196F3" strokeWidth={1.5} fill="none" />
                {/* Temperatura (Rojo) */}
                <Path d={pathTemp} stroke="#F44336" strokeWidth={1.5} fill="none" />
                {/* ITH (Verde Grueso) */}
                <Path d={pathIth} stroke="#4CAF50" strokeWidth={3} fill="none" />

                {/* --- ETIQUETAS VALOR ITH --- */}
                {points.map((p, i) => {
                    // Submuestreo
                    if (points.length > 20 && i % Math.ceil(points.length / 20) !== 0) return null;
                    return (
                        <SvgText
                            key={`ith-val-${i}`}
                            x={p.x}
                            y={p.yIth - 8}
                            fill="#2E7D32"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                        >
                            {Math.round(p.data.indice)}
                        </SvgText>
                    );
                })}

                {/* --- TOOLTIP LINE & DOT (Inside SVG for sync) --- */}
                {tooltipIndex !== null && points[tooltipIndex] && (
                    <G>
                        <Line
                            x1={points[tooltipIndex].x} y1={0}
                            x2={points[tooltipIndex].x} y2={CHART_HEIGHT}
                            stroke="#333" strokeDasharray="2, 2"
                        />
                        <Circle cx={points[tooltipIndex].x} cy={points[tooltipIndex].yIth} r={4} fill="#4CAF50" />
                    </G>
                )}
            </G>
        </Svg>
    );

    return (
        <View style={{ width, height, backgroundColor: '#fff' }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={{ flexGrow: 1 }}
            >
                {chartContent}
            </ScrollView>

            {/* INFO BOX (Fixed Overlay) */}
            {tooltipIndex !== null && points[tooltipIndex] && (
                <View style={styles.tooltipBox}>
                    <Text style={styles.tooltipTitle}>
                        {points[tooltipIndex].data.parsedDate.toLocaleDateString()} {points[tooltipIndex].data.parsedDate.toLocaleTimeString()}
                    </Text>
                    {(() => {
                        const ithVal = parseFloat(points[tooltipIndex].data.indice);
                        let ithColor = 'black';
                        if (ithVal < 68) ithColor = '#4CAF50';
                        else if (ithVal < 72) ithColor = '#bbca33ff';
                        else if (ithVal < 80) ithColor = '#d6c52fff';
                        else if (ithVal < 90) ithColor = '#FF9800';
                        else ithColor = '#F44336';

                        const tempVal = parseFloat(points[tooltipIndex].data.temperatura);
                        let tempColor = 'black';
                        if (tempVal < 20) tempColor = '#2196F3';
                        else if (tempVal < 30) tempColor = '#4CAF50';
                        else if (tempVal < 36) tempColor = '#FF9800';
                        else tempColor = '#F44336';

                        return (
                            <>
                                <Text style={{ color: 'black' }}>
                                    ITH: <Text style={{ color: ithColor, fontWeight: 'bold' }}>{points[tooltipIndex].data.indice}</Text>
                                </Text>
                                <Text style={{ color: 'black' }}>
                                    Temp: <Text style={{ color: tempColor, fontWeight: 'bold' }}>{points[tooltipIndex].data.temperatura}°C</Text>
                                </Text>
                                <Text style={{ color: 'black' }}>
                                    Hum: <Text style={{ color: '#2196F3', fontWeight: 'bold' }}>{points[tooltipIndex].data.humedad}%</Text>
                                </Text>
                                <Text style={{ color: 'black' }}>
                                    Estado: {ESTADOS_LABEL[points[tooltipIndex].data.estado] || '?'}
                                </Text>
                            </>
                        );
                    })()}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    tooltipBox: {
        position: 'absolute',
        top: 10,
        left: 50,
        backgroundColor: 'rgba(255,255,255,0.9)',
        padding: 8,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: "#000",
        elevation: 3
    },
    tooltipTitle: {
        fontWeight: 'bold',
        marginBottom: 2
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5
    }
});
