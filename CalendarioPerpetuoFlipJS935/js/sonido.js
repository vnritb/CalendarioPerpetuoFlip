/*
 * sonido.js
 * Equivalente JS de FlipSoundPlayer.swift: genera con Web Audio API un
 * "rrrrr" de trinquete seguido de un golpe seco "clk!", sin usar ningun
 * archivo de audio. Usa AudioContext con fallback a webkitAudioContext
 * (necesario en Safari de iOS 9.3.5).
 */
var Sonido = (function () {
    'use strict';

    var ctx = null;
    var buffer = null;
    var desbloqueado = false;

    function obtenerContexto() {
        if (!ctx) {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) { return null; }
            ctx = new AC();
        }
        return ctx;
    }

    // Generador pseudoaleatorio simple (LCG de 32 bits) para el ruido blanco.
    function crearGeneradorRuido(semillaInicial) {
        var estado = semillaInicial;
        return function () {
            estado = (estado * 1103515245 + 12345) & 0x7fffffff;
            var valor = (estado % 65536) / 65536;
            return valor * 2 - 1;
        };
    }

    function generarBuffer() {
        var c = obtenerContexto();
        if (!c) { return null; }
        var sampleRate = c.sampleRate;

        var duracionTrinquete = 0.15;
        var duracionGolpe = 0.06;
        var duracionTotal = duracionTrinquete + duracionGolpe + 0.03;
        var numFrames = Math.floor(sampleRate * duracionTotal);

        var buf = c.createBuffer(1, numFrames, sampleRate);
        var datos = buf.getChannelData(0);
        var ruidoBlanco = crearGeneradorRuido(0x2545F491 >>> 0);

        var framesTrinquete = Math.floor(sampleRate * duracionTrinquete);
        var i, t, ruido, modulacion, envolvente;
        for (i = 0; i < framesTrinquete; i++) {
            t = i / sampleRate;
            ruido = ruidoBlanco();
            // Modulacion en "dientes" para simular el trinquete mecanico (rrrrr).
            modulacion = 0.35 + 0.65 * Math.abs(Math.sin(2 * Math.PI * 42 * t));
            envolvente = 1.0 - (t / duracionTrinquete) * 0.55;
            datos[i] = ruido * modulacion * envolvente * 0.45;
        }

        var inicioGolpe = framesTrinquete;
        var framesGolpe = Math.floor(sampleRate * duracionGolpe);
        var tono;
        for (i = 0; i < framesGolpe; i++) {
            t = i / sampleRate;
            ruido = ruidoBlanco();
            tono = Math.sin(2 * Math.PI * 180 * t);
            envolvente = Math.exp(-t * 55);
            datos[inicioGolpe + i] = (ruido * 0.6 + tono * 0.4) * envolvente * 0.9;
        }

        for (i = inicioGolpe + framesGolpe; i < numFrames; i++) {
            datos[i] = 0;
        }

        return buf;
    }

    // Debe llamarse dentro de un gesto de usuario (touchstart) para que
    // Safari de iOS permita reproducir audio despues.
    function desbloquear() {
        var c = obtenerContexto();
        if (!c) { return; }
        if (c.state === 'suspended' && c.resume) { c.resume(); }
        if (!desbloqueado) {
            var buf = c.createBuffer(1, 1, c.sampleRate);
            var src = c.createBufferSource();
            src.buffer = buf;
            src.connect(c.destination);
            if (src.start) { src.start(0); } else if (src.noteOn) { src.noteOn(0); }
            desbloqueado = true;
        }
    }

    // Reproduce el sonido de flip; puede llamarse muchas veces seguidas
    // (una por cada lamina que gira) sin que se corten entre si, ya que
    // cada llamada crea su propio nodo fuente independiente.
    function reproducirFlip() {
        var c = obtenerContexto();
        if (!c) { return; }
        if (!buffer) { buffer = generarBuffer(); }
        if (!buffer) { return; }
        var src = c.createBufferSource();
        src.buffer = buffer;
        src.connect(c.destination);
        if (src.start) { src.start(0); } else if (src.noteOn) { src.noteOn(0); }
    }

    return {
        desbloquear: desbloquear,
        reproducirFlip: reproducirFlip
    };
})();
