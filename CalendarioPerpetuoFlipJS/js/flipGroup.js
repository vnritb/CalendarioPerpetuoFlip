/*
 * flipGroup.js
 * Equivalente JS de FlipGroupView.swift: agrupa varias FlipCharacter en
 * fila para formar una palabra (dia de semana / mes, 3 caracteres) o un
 * numero (dia del mes, 2 digitos).
 */
var FlipGroup = (function () {
    'use strict';

    var ESPACIADO = 6; // px, igual que "espaciado" en Swift

    function crear(numCaracteres, onAnimStart, onAnimEnd) {
        var el = document.createElement('div');
        el.className = 'flip-grupo';

        var celdas = [];
        var i;
        for (i = 0; i < numCaracteres; i++) {
            var celda = FlipCharacter.crear(' ', onAnimStart, onAnimEnd);
            celdas.push(celda);
            el.appendChild(celda.el);
        }

        return {
            el: el,

            setCaracteres: function (arr) {
                var n = Math.min(arr.length, celdas.length);
                for (var i = 0; i < n; i++) {
                    celdas[i].setChar(arr[i]);
                }
            },

            setColor: function (col) {
                for (var i = 0; i < celdas.length; i++) {
                    celdas[i].setColor(col);
                }
            },

            setSize: function (anchoTotal, altoTotal) {
                var n = celdas.length;
                if (n === 0) { return; }
                var anchoCelda = (anchoTotal - ESPACIADO * (n - 1)) / n;
                if (anchoCelda < 1) { anchoCelda = 1; }
                for (var i = 0; i < n; i++) {
                    celdas[i].setSize(anchoCelda, altoTotal);
                }
            }
        };
    }

    return { crear: crear };
})();
