/*
 * datos.js
 * Equivalente JS de CalendarioDatos.swift: abreviaturas ES y calculo de
 * fechas. Escrito en ES5 puro (var, function) para compatibilidad con
 * Safari de iOS 9.3.5.
 */
var Datos = (function () {
    'use strict';

    // Mismo orden que Date.getDay(): 0 = domingo ... 6 = sabado.
    var diasSemana = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

    // Indice 0 = enero ... 11 = diciembre (igual que Date.getMonth()).
    var meses = [
        "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
        "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
    ];

    // Extrae dia de la semana, dia del mes y mes (abreviados) de una fecha.
    function componentes(fecha) {
        return {
            diaSemanaAbrev: diasSemana[fecha.getDay()],
            diaMes: fecha.getDate(),
            mesAbrev: meses[fecha.getMonth()]
        };
    }

    // Suma (o resta, si es negativo) un numero de dias a una fecha.
    function sumarDias(dias, fecha) {
        var f = new Date(fecha.getTime());
        f.setDate(f.getDate() + dias);
        return f;
    }

    // Medianoche (00:00) del dia que contiene "fecha".
    function inicioDelDia(fecha) {
        return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
    }

    // Instante de la proxima medianoche a partir de "fecha".
    function proximaMedianoche(fecha) {
        var hoy = inicioDelDia(fecha);
        var manana = new Date(hoy.getTime());
        manana.setDate(manana.getDate() + 1);
        return manana;
    }

    // Los 2 digitos del dia del mes, con cero a la izquierda, como array de caracteres.
    function digitosDia(diaMes) {
        var n = Math.max(1, Math.min(31, diaMes));
        var texto = (n < 10 ? '0' + n : '' + n);
        return texto.split('');
    }

    // Los caracteres de una abreviatura (dia de semana o mes) como array.
    function caracteres(abreviatura) {
        return abreviatura.split('');
    }

    return {
        diasSemana: diasSemana,
        meses: meses,
        componentes: componentes,
        sumarDias: sumarDias,
        inicioDelDia: inicioDelDia,
        proximaMedianoche: proximaMedianoche,
        digitosDia: digitosDia,
        caracteres: caracteres
    };
})();
