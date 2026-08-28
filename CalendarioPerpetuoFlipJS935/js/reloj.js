/*
 * reloj.js
 * Equivalente JS de AnalogClockView.swift: reloj analogico clasico
 * (esfera blanca, agujas y numeros negros), construido con divs
 * posicionados/rotados con transform en vez de <canvas>, para que se
 * pueda restilar facilmente y se mantenga nitido en cualquier tamano.
 */
var Reloj = (function () {
    'use strict';

    function crear() {
        var el = document.createElement('div');
        el.className = 'reloj-analogico';
        el.style.width = '100%';
        el.style.height = '100%';

        var esfera = document.createElement('div');
        esfera.style.position = 'absolute';
        esfera.style.borderRadius = '50%';
        esfera.style.backgroundColor = '#ffffff';
        el.appendChild(esfera);

        var marcas = [];
        var i;
        for (i = 0; i < 60; i++) {
            var contenedor = document.createElement('div');
            contenedor.style.position = 'absolute';
            var marca = document.createElement('div');
            marca.className = 'reloj-marca';
            marca.style.backgroundColor = '#000000';
            contenedor.appendChild(marca);
            el.appendChild(contenedor);
            marcas.push({ contenedor: contenedor, marca: marca });
        }

        var numeros = [];
        for (i = 1; i <= 12; i++) {
            var num = document.createElement('div');
            num.className = 'reloj-numero';
            num.textContent = '' + i;
            el.appendChild(num);
            numeros.push(num);
        }

        function crearAguja() {
            var cont = document.createElement('div');
            cont.className = 'reloj-aguja-cont';
            var barra = document.createElement('div');
            barra.className = 'reloj-aguja';
            cont.appendChild(barra);
            el.appendChild(cont);
            return { cont: cont, barra: barra };
        }

        var horaria = crearAguja();
        var minutera = crearAguja();
        var segundera = crearAguja();
        segundera.barra.style.backgroundColor = '#000000';

        var centro = document.createElement('div');
        centro.className = 'reloj-centro';
        el.appendChild(centro);

        var lado = 0;

        function setSize(w, h) {
            lado = Math.min(w, h) * 0.92;
            var cx = w / 2;
            var cy = h / 2;

            esfera.style.width = lado + 'px';
            esfera.style.height = lado + 'px';
            esfera.style.left = (cx - lado / 2) + 'px';
            esfera.style.top = (cy - lado / 2) + 'px';
            esfera.style.border = Math.max(1, lado * 0.02) + 'px solid #000000';

            var i;
            for (i = 0; i < 60; i++) {
                var esHora = (i % 5 === 0);
                var anchoM = esHora ? lado * 0.012 : lado * 0.006;
                var altoM = esHora ? lado * 0.045 : lado * 0.02;
                var m = marcas[i];

                m.contenedor.style.width = lado + 'px';
                m.contenedor.style.height = lado + 'px';
                m.contenedor.style.left = (cx - lado / 2) + 'px';
                m.contenedor.style.top = (cy - lado / 2) + 'px';
                m.contenedor.style.webkitTransformOrigin = '50% 50%';
                m.contenedor.style.transformOrigin = '50% 50%';
                var girado = 'rotate(' + (i * 6) + 'deg)';
                m.contenedor.style.webkitTransform = girado;
                m.contenedor.style.transform = girado;

                m.marca.style.position = 'absolute';
                m.marca.style.left = '50%';
                m.marca.style.top = (lado * 0.06) + 'px';
                m.marca.style.width = anchoM + 'px';
                m.marca.style.height = altoM + 'px';
                m.marca.style.marginLeft = (-anchoM / 2) + 'px';
            }

            for (i = 1; i <= 12; i++) {
                var anguloDeg = i * 30 - 90;
                var anguloRad = anguloDeg * Math.PI / 180;
                var radio = lado * 0.36;
                var tam = lado * 0.09;
                var num = numeros[i - 1];
                num.style.fontSize = tam + 'px';
                num.style.width = (tam * 2) + 'px';
                num.style.left = (cx + radio * Math.cos(anguloRad) - tam) + 'px';
                num.style.top = (cy + radio * Math.sin(anguloRad) - tam * 0.6) + 'px';
            }

            posicionarAguja(horaria, lado * 0.32, lado * 0.035, cx, cy, lado);
            posicionarAguja(minutera, lado * 0.44, lado * 0.025, cx, cy, lado);
            posicionarAguja(segundera, lado * 0.46, lado * 0.008, cx, cy, lado);

            var diamCentro = lado * 0.045;
            centro.style.width = diamCentro + 'px';
            centro.style.height = diamCentro + 'px';
            centro.style.left = (cx - diamCentro / 2) + 'px';
            centro.style.top = (cy - diamCentro / 2) + 'px';
        }

        function posicionarAguja(aguja, longitud, grosor, cx, cy, ladoActual) {
            aguja.cont.style.width = ladoActual + 'px';
            aguja.cont.style.height = ladoActual + 'px';
            aguja.cont.style.left = (cx - ladoActual / 2) + 'px';
            aguja.cont.style.top = (cy - ladoActual / 2) + 'px';
            aguja.cont.style.webkitTransformOrigin = '50% 50%';
            aguja.cont.style.transformOrigin = '50% 50%';

            aguja.barra.style.width = grosor + 'px';
            aguja.barra.style.height = longitud + 'px';
            aguja.barra.style.marginLeft = (-grosor / 2) + 'px';
            aguja.barra.style.borderRadius = (grosor / 2) + 'px';
            if (!aguja.barra.style.backgroundColor) {
                aguja.barra.style.backgroundColor = '#000000';
            }
            aguja._longitud = longitud;
        }

        function girar(cont, grados) {
            var t = 'rotate(' + grados + 'deg)';
            cont.style.webkitTransform = t;
            cont.style.transform = t;
        }

        function actualizar(hora) {
            var h = hora.getHours();
            var m = hora.getMinutes();
            var s = hora.getSeconds();
            var ms = hora.getMilliseconds();

            var anguloSegundero = (s + ms / 1000) / 60 * 360;
            var anguloMinutero = (m + s / 60) / 60 * 360;
            var anguloHorario = ((h % 12) + m / 60) / 12 * 360;

            girar(horaria.cont, anguloHorario);
            girar(minutera.cont, anguloMinutero);
            girar(segundera.cont, anguloSegundero);
        }

        return {
            el: el,
            setSize: setSize,
            actualizar: actualizar
        };
    }

    return { crear: crear };
})();
