/**
 * Modelo de Datos MedicionITH
 * 
 * Ruta en Firebase: tambos/{nombre_tambo}/mediciones_ith/{timestamp_id}
 */

export class MedicionITH {
    /**
     * @param {Object} data - Objeto con datos de la medición
     * @param {string|Date} data.date - Fecha y hora (ISO 8601 recomendado)
     * @param {number} data.estado - Estado del sistema (0=OFF, 3=ON)
     * @param {number} data.humedad - Porcentaje de humedad
     * @param {number} data.indice - Valor del índice ITH calculado
     * @param {number} data.temperatura - Temperatura en grados
     */
    constructor({ date, estado, humedad, indice, temperatura }) {
        this.date = date;
        this.estado = estado;
        this.humedad = humedad;
        this.indice = indice;
        this.temperatura = temperatura;
    }

    /**
     * Crea una instancia desde un snapshot de Firebase.
     * @param {Object} snapshot - DataSnapshot de Firebase
     * @returns {MedicionITH} Nueva instancia
     */
    static fromFirebase(snapshot) {
        const data = snapshot.val();
        return new MedicionITH(data);
    }
}

// Constantes para estado del sistema
export const ESTADO_SISTEMA = {
    OFF: 0,
    ON: 3
};
