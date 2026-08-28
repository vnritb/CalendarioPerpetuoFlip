/*
 * estadoFlip.js
 * Equivalente JS de EstadoFlip.swift: colores segun la fase de la lamina.
 * normal = blanco (fecha real), arrastrando = ambar (dedo moviendose),
 * alerta = rojo (fecha "en pausa" tras soltar el dedo).
 */
var EstadoFlip = {
    normal: '#ffffff',
    arrastrando: '#ffd126',
    alerta: '#eb2929',

    colorPara: function (fase) {
        if (fase === 'arrastrando') { return this.arrastrando; }
        if (fase === 'alerta') { return this.alerta; }
        return this.normal;
    }
};
