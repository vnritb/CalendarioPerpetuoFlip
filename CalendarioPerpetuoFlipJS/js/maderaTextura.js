/*
 * maderaTextura.js
 * Equivalente JS de WoodTexture (WoodenFrame.swift): fondo de madera
 * dibujado a mano con gradientes, vetas y "nudos" procedurales en un
 * <canvas>, sin depender de ninguna imagen externa.
 */
var Madera = (function () {
    'use strict';

    function crearGeneradorRuido(semillaInicial) {
        var estado = semillaInicial;
        return function () {
            estado = (estado * 1103515245 + 12345) & 0x7fffffff;
            var valor = (estado % 65536) / 65536;
            return valor;
        };
    }

    function dibujar(canvas) {
        var ctx = canvas.getContext('2d');
        var w = canvas.width;
        var h = canvas.height;
        if (w <= 0 || h <= 0) { return; }

        var gradienteBase = ctx.createLinearGradient(0, 0, w, h);
        gradienteBase.addColorStop(0, 'rgb(133,84,46)');
        gradienteBase.addColorStop(0.5, 'rgb(92,56,31)');
        gradienteBase.addColorStop(1, 'rgb(56,31,15)');
        ctx.fillStyle = gradienteBase;
        ctx.fillRect(0, 0, w, h);

        var siguiente = crearGeneradorRuido(987654321);

        var numVetas = 26;
        var i, p, yBase, x, ondulacion, opacidad;
        for (i = 0; i < numVetas; i++) {
            yBase = h * i / numVetas;
            ctx.beginPath();
            ctx.moveTo(0, yBase);
            var pasos = 10;
            for (p = 1; p <= pasos; p++) {
                x = w * p / pasos;
                ondulacion = (siguiente() - 0.5) * h * 0.035;
                ctx.lineTo(x, yBase + ondulacion);
            }
            opacidad = 0.06 + siguiente() * 0.10;
            ctx.strokeStyle = 'rgba(0,0,0,' + opacidad + ')';
            ctx.lineWidth = 1 + siguiente() * 1.5;
            ctx.stroke();
        }

        var nudos = 4;
        var cx, cy, r;
        for (i = 0; i < nudos; i++) {
            cx = siguiente() * w;
            cy = siguiente() * h;
            r = 4 + siguiente() * 10;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fill();
        }

        var radial = ctx.createRadialGradient(
            w / 2, h / 2, Math.min(w, h) * 0.3,
            w / 2, h / 2, Math.max(w, h) * 0.75
        );
        radial.addColorStop(0, 'rgba(0,0,0,0)');
        radial.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, w, h);
    }

    return { dibujar: dibujar };
})();
