/**
 * MedicionITH Data Model
 * 
 * Path: tambos/{nombre_tambo}/mediciones_ith/{timestamp_id}
 */

export class MedicionITH {
    constructor({ date, estado, humedad, indice, temperatura }) {
        this.date = date; // DateTime/String (ISO 8601 recommended: 2025-09-29T10:36:43Z)
        this.estado = estado; // Integer: 0=OFF, 3=ON
        this.humedad = humedad; // Integer
        this.indice = indice; // Integer: ITH Value
        this.temperatura = temperatura; // Integer
    }

    static fromFirebase(snapshot) {
        const data = snapshot.val();
        return new MedicionITH(data);
    }
}

export const ESTADO_SISTEMA = {
    OFF: 0,
    ON: 3
};
