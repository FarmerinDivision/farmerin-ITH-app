export const ITH_RANGES = {
  NO_STRESS: { max: 67, label: "Sin estrés calórico", color: "#4CAF50" }, // Green
  MILD_STRESS: { min: 68, max: 71, label: "Estrés calórico leve", color: "#CDDC39" }, // Lime/Green-Yellow (Dark Green/Light Yellow in prompt)
  MODERATE_STRESS: { min: 72, max: 79, label: "Estrés calórico moderado", color: "#FFEB3B" }, // Yellow
  HEAVY_STRESS: { min: 80, max: 89, label: "Estrés calórico pesado", color: "#FF9800" }, // Orange/Red
  SEVERE_STRESS: { min: 90, label: "Estrés calórico grave/mortal", color: "#F44336" }, // Red
};

/**
 * Calculates the Stress Level based on ITH Value.
 * @param {number} ithValue - The ITH index value.
 * @returns {object} - Object containing { label, color, level }
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
    return ITH_RANGES.SEVERE_STRESS;
  }
}
