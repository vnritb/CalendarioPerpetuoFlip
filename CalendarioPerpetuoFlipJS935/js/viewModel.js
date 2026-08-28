/*
 * viewModel.js
 * Equivalente JS de CalendarioViewModel.swift: mantiene la fecha real y
 * la hora del reloj, gestiona el gesto de swipe (arrastreEnCurso /
 * arrastreFinalizado) y programa la actualizacion automatica a
 * medianoche, ademas de una verificacion horaria de seguridad.
 */
var ViewModel = (function () {
    'use strict';

    var instantanea = null;
    var horaActual = new Date();
    var fechaReal = new Date();

    var desplazamientoConfirmado = 0;
    var desplazamientoEnCurso = 0;
    var arrastrando = false;
    var animacionesActivas = 0;

    var PUNTOS_POR_DIA = 60;           // px de arrastre por dia
    var SEGUNDOS_VISTA_PREVIA = 6;      // segundos en rojo tras soltar el dedo

    var timerReloj = null;
    var timerMedianoche = null;
    var timerVerificacion = null;
    var timerRevertir = null;

    var listenersInstantanea = [];
    var listenersHora = [];

    function arraysIguales(a, b) {
        if (a.length !== b.length) { return false; }
        for (var i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) { return false; }
        }
        return true;
    }

    function instantaneasIguales(a, b) {
        if (!a || !b) { return false; }
        return a.fase === b.fase &&
            arraysIguales(a.diaSemana, b.diaSemana) &&
            arraysIguales(a.diaMes, b.diaMes) &&
            arraysIguales(a.mes, b.mes);
    }

    function instantaneaDesde(fecha, fase) {
        var comp = Datos.componentes(fecha);
        return {
            diaSemana: Datos.caracteres(comp.diaSemanaAbrev),
            diaMes: Datos.digitosDia(comp.diaMes),
            mes: Datos.caracteres(comp.mesAbrev),
            fase: fase
        };
    }

    function emitInstantanea() {
        for (var i = 0; i < listenersInstantanea.length; i++) {
            listenersInstantanea[i](instantanea);
        }
    }

    function emitHora() {
        for (var i = 0; i < listenersHora.length; i++) {
            listenersHora[i](horaActual);
        }
    }

    function actualizarInstantanea(fase) {
        var total = desplazamientoConfirmado + desplazamientoEnCurso;
        var fechaMostrada = Datos.sumarDias(total, fechaReal);
        var nueva = instantaneaDesde(fechaMostrada, fase);
        if (instantaneasIguales(nueva, instantanea)) { return; }
        instantanea = nueva;
        emitInstantanea();
    }

    // --- Reloj analogico (independiente del flip) ---

    function iniciarRelojDeSegundos() {
        if (timerReloj) { clearInterval(timerReloj); }
        timerReloj = setInterval(function () {
            horaActual = new Date();
            emitHora();
        }, 1000);
    }

    // --- Actualizacion automatica a medianoche ---

    function programarMedianoche() {
        if (timerMedianoche) { clearTimeout(timerMedianoche); }
        var proxima = Datos.proximaMedianoche(new Date());
        var intervalo = Math.max(1000, proxima.getTime() - Date.now());
        timerMedianoche = setTimeout(function () {
            fechaReal = new Date();
            actualizarInstantanea('normal');
            programarMedianoche();
        }, intervalo);
    }

    // --- Verificacion horaria de integridad ---

    function verificarYCorregirFecha() {
        var fechaActual = new Date();
        var comp = Datos.componentes(fechaActual);
        var diaSemanaEsperado = Datos.caracteres(comp.diaSemanaAbrev);
        var diaMesEsperado = Datos.digitosDia(comp.diaMes);
        var mesEsperado = Datos.caracteres(comp.mesAbrev);

        var necesitaCorreccion = !instantanea ||
            !arraysIguales(instantanea.diaSemana, diaSemanaEsperado) ||
            !arraysIguales(instantanea.diaMes, diaMesEsperado) ||
            !arraysIguales(instantanea.mes, mesEsperado);

        if (necesitaCorreccion) {
            fechaReal = fechaActual;
            instantanea = {
                diaSemana: diaSemanaEsperado,
                diaMes: diaMesEsperado,
                mes: mesEsperado,
                fase: 'normal'
            };
            emitInstantanea();
        }
    }

    function programarVerificacionHoraria() {
        if (timerVerificacion) { clearInterval(timerVerificacion); }
        timerVerificacion = setInterval(function () {
            if (!arrastrando && desplazamientoConfirmado === 0) {
                verificarYCorregirFecha();
            }
        }, 3600000);
        verificarYCorregirFecha();
    }

    // --- Gesto de swipe (navegacion temporal) ---

    function arrastreEnCurso(traslacionVertical) {
        if (animacionesActivas > 0) { return; }
        arrastrando = true;
        if (timerRevertir) { clearTimeout(timerRevertir); }

        var dias = Math.round(traslacionVertical / PUNTOS_POR_DIA);
        if (dias === desplazamientoEnCurso) { return; }

        desplazamientoEnCurso = dias;
        actualizarInstantanea('arrastrando');
    }

    function arrastreFinalizado() {
        if (animacionesActivas > 0) {
            arrastrando = false;
            desplazamientoEnCurso = 0;
            return;
        }

        arrastrando = false;
        desplazamientoConfirmado += desplazamientoEnCurso;
        desplazamientoEnCurso = 0;

        actualizarInstantanea('alerta');

        if (timerRevertir) { clearTimeout(timerRevertir); }
        timerRevertir = setTimeout(function () {
            desplazamientoConfirmado = 0;
            actualizarInstantanea('normal');
        }, SEGUNDOS_VISTA_PREVIA * 1000);
    }

    // --- Control de animaciones (bloqueo transaccional) ---

    function notificarInicioAnimacion() {
        animacionesActivas += 1;
    }

    function notificarFinAnimacion() {
        animacionesActivas = Math.max(0, animacionesActivas - 1);
    }

    // --- Ciclo de vida ---

    function iniciar() {
        actualizarInstantanea('normal');
        iniciarRelojDeSegundos();
        programarMedianoche();
        programarVerificacionHoraria();

        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                verificarYCorregirFecha();
                fechaReal = new Date();
                actualizarInstantanea('normal');
                programarMedianoche();
            }
        }, false);

        window.addEventListener('pageshow', function () {
            fechaReal = new Date();
            verificarYCorregirFecha();
        }, false);
    }

    function detener() {
        if (timerReloj) { clearInterval(timerReloj); }
        if (timerMedianoche) { clearTimeout(timerMedianoche); }
        if (timerVerificacion) { clearInterval(timerVerificacion); }
        if (timerRevertir) { clearTimeout(timerRevertir); }
    }

    return {
        iniciar: iniciar,
        detener: detener,
        arrastreEnCurso: arrastreEnCurso,
        arrastreFinalizado: arrastreFinalizado,
        notificarInicioAnimacion: notificarInicioAnimacion,
        notificarFinAnimacion: notificarFinAnimacion,
        onInstantanea: function (cb) {
            listenersInstantanea.push(cb);
            if (instantanea) { cb(instantanea); }
        },
        onHora: function (cb) {
            listenersHora.push(cb);
            cb(horaActual);
        }
    };
})();
