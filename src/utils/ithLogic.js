// Rangos de ITH y sus niveles de estrés asociados
export const ITH_RANGES = {
  NO_STRESS: { max: 67, label: "Sin estrés calórico", color: "#4CAF50" }, // Verde
  MILD_STRESS: { min: 68, max: 71, label: "Estrés calórico leve", color: "#CDDC39" }, // Lima
  MODERATE_STRESS: { min: 72, max: 79, label: "Estrés calórico moderado", color: "#FFEB3B" }, // Amarillo Oscuro
  HEAVY_STRESS: { min: 80, max: 89, label: "Estrés calórico pesado", color: "#FF9800" }, // Naranja
  SEVERE_STRESS: { min: 90, label: "Estrés calórico grave/mortal", color: "#F44336" }, // Rojo
};

/**
 * Calcula el nivel de estrés basado en el valor ITH.
 * @param {number} ithValue - Valor del índice ITH.
 * @returns {object} - Objeto con { label, color, level } correspondiente al rango.
 */
export function getStressLevel(ithValue) {
  if (ithValue < 68) {
    return ITH_RANGES.NO_STRESS;
  } else if (ithValue >= 68 && ithValue <= 71) {
    return ITH_RANGES.MILD_STRESS;
  } else if (ithValue >= 72 && ithValue <= 79) {
    return ITH_RANGES.MODERATE_STRESS;
  } else if (ithValue >= 80 && ithValue <= 89) {
    return ITH_RANGES.HEAVY_STRESS;
  } else {
    // Mayor o igual a 90
    return ITH_RANGES.SEVERE_STRESS;
  }
}
