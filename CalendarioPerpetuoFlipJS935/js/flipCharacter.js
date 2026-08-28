/*
 * flipCharacter.js
 * Equivalente JS de FlipCharacterView.swift: una unica lamina flip (un
 * caracter), con dos mitades negras estaticas separadas por una bisagra
 * metalica, y dos "solapas" que giran en dos fases (rotateX 3D) para
 * revelar el siguiente caracter, igual que un panel de aeropuerto.
 *
 * Toda la animacion se hace con transiciones CSS (transform: rotateX)
 * encadenadas mediante setTimeout, en vez de Promises/async, para
 * maxima compatibilidad con el motor JS de Safari en iOS 9.3.5.
 */
var FlipCharacter = (function () {
    'use strict';

    var DURACION_FASE = 0.16; // segundos, igual que duracionFase en Swift

    function crearMitad(esSuperior) {
        var el = document.createElement('div');
        el.className = 'flip-panel';
        // OJO: "backface-visibility:hidden" NO se pone aqui. Solo hace
        // falta en las solapas que realmente giran (ver mas abajo); en
        // Safari de iOS 9/10, un panel SIN transform que ademas tiene
        // border-radius + overflow:hidden y ademas backface-visibility:
        // hidden, dentro de un contenedor con "perspective", puede
        // quedar completamente invisible (bug conocido de WebKit viejo
        // con el compositing de elementos 3D). Como las mitades
        // estaticas nunca rotan, no necesitan backface-visibility y así
        // evitamos ese bug.
        if (esSuperior) {
            el.style.top = '0';
        } else {
            el.style.bottom = '0';
        }

        var texto = document.createElement('div');
        texto.className = 'flip-texto';
        el.appendChild(texto);

        return {
            el: el,
            textoEl: texto,
            esSuperior: esSuperior,
            setTexto: function (c) {
                texto.textContent = c;
            },
            setColor: function (col) {
                texto.style.color = col;
            },
            setTamano: function (w, h, radio) {
                el.style.width = w + 'px';
                el.style.height = (h / 2) + 'px';
                if (esSuperior) {
                    el.style.borderTopLeftRadius = radio + 'px';
                    el.style.borderTopRightRadius = radio + 'px';
                    el.style.borderBottomLeftRadius = '0';
                    el.style.borderBottomRightRadius = '0';
                } else {
                    el.style.borderBottomLeftRadius = radio + 'px';
                    el.style.borderBottomRightRadius = radio + 'px';
                    el.style.borderTopLeftRadius = '0';
                    el.style.borderTopRightRadius = '0';
                }
                texto.style.width = w + 'px';
                texto.style.height = h + 'px';
                texto.style.lineHeight = h + 'px';
                texto.style.fontSize = Math.min(h * 0.92, w * 2.10) + 'px';
                texto.style.top = esSuperior ? '0' : (-(h / 2)) + 'px';
            }
        };
    }

    function crear(caracterInicial, onAnimStart, onAnimEnd) {
        var raiz = document.createElement('div');
        raiz.className = 'flip-celda';

        var panelSuperior = crearMitad(true);
        var panelInferior = crearMitad(false);
        var solapaSuperior = crearMitad(true);
        var solapaInferior = crearMitad(false);

        solapaSuperior.el.style.zIndex = '3';
        solapaInferior.el.style.zIndex = '3';
        solapaSuperior.el.style.display = 'none';
        solapaInferior.el.style.display = 'none';
        solapaSuperior.el.style.webkitTransformOrigin = '50% 100%';
        solapaSuperior.el.style.transformOrigin = '50% 100%';
        solapaSuperior.el.style.boxShadow = '0 2px 3px rgba(0,0,0,0.6)';
        solapaInferior.el.style.webkitTransformOrigin = '50% 0%';
        solapaInferior.el.style.transformOrigin = '50% 0%';
        solapaInferior.el.style.boxShadow = '0 -1px 3px rgba(0,0,0,0.5)';
        // Estas dos SI giran (rotateX), asi que necesitan backface-visibility
        // para no mostrar el caracter "en espejo" a mitad de giro.
        solapaSuperior.el.style.webkitBackfaceVisibility = 'hidden';
        solapaSuperior.el.style.backfaceVisibility = 'hidden';
        solapaInferior.el.style.webkitBackfaceVisibility = 'hidden';
        solapaInferior.el.style.backfaceVisibility = 'hidden';

        var bisagra = document.createElement('div');
        bisagra.className = 'flip-bisagra';

        var marco = document.createElement('div');
        marco.className = 'flip-marco';

        raiz.appendChild(panelSuperior.el);
        raiz.appendChild(panelInferior.el);
        raiz.appendChild(solapaSuperior.el);
        raiz.appendChild(solapaInferior.el);
        raiz.appendChild(bisagra);
        raiz.appendChild(marco);

        var estado = {
            actual: caracterInicial,
            color: EstadoFlip.normal,
            animando: false,
            pendiente: null
        };

        panelSuperior.setTexto(caracterInicial);
        panelInferior.setTexto(caracterInicial);
        panelSuperior.setColor(estado.color);
        panelInferior.setColor(estado.color);

        function fijarTransformInmediato(el, gradosX) {
            el.style.webkitTransition = 'none';
            el.style.transition = 'none';
            el.style.webkitTransform = 'rotateX(' + gradosX + 'deg)';
            el.style.transform = 'rotateX(' + gradosX + 'deg)';
            // Forzar reflow para que el siguiente cambio de transition/transform
            // se anime de verdad (si no, el navegador colapsa ambos cambios).
            /* jshint expr: true */
            void el.offsetHeight;
        }

        function animarTransform(el, gradosX, curva) {
            el.style.webkitTransition = 'transform ' + DURACION_FASE + 's ' + curva;
            el.style.transition = 'transform ' + DURACION_FASE + 's ' + curva;
            el.style.webkitTransform = 'rotateX(' + gradosX + 'deg)';
            el.style.transform = 'rotateX(' + gradosX + 'deg)';
        }

        function iniciarFlip(nuevo) {
            if (typeof onAnimStart === 'function') { onAnimStart(); }
            estado.animando = true;

            solapaSuperior.setTexto(estado.actual);
            solapaSuperior.setColor(estado.color);
            solapaSuperior.el.style.display = 'block';
            fijarTransformInmediato(solapaSuperior.el, 0);

            Sonido.reproducirFlip();

            setTimeout(function () {
                animarTransform(solapaSuperior.el, -90, 'ease-in');
            }, 16);

            setTimeout(function () {
                // La solapa superior ya esta de canto (invisible): momento de
                // intercambiar, sin que se note, el fondo superior estatico.
                solapaSuperior.el.style.display = 'none';
                panelSuperior.setTexto(nuevo);
                panelSuperior.setColor(estado.color);

                solapaInferior.setTexto(nuevo);
                solapaInferior.setColor(estado.color);
                solapaInferior.el.style.display = 'block';
                fijarTransformInmediato(solapaInferior.el, 90);

                setTimeout(function () {
                    animarTransform(solapaInferior.el, 0, 'ease-out');
                }, 16);

                setTimeout(function () {
                    solapaInferior.el.style.display = 'none';
                    panelInferior.setTexto(nuevo);
                    panelInferior.setColor(estado.color);
                    estado.actual = nuevo;
                    estado.animando = false;

                    if (typeof onAnimEnd === 'function') { onAnimEnd(); }

                    if (estado.pendiente !== null) {
                        var siguiente = estado.pendiente;
                        estado.pendiente = null;
                        if (siguiente !== nuevo) { iniciarFlip(siguiente); }
                    }
                }, DURACION_FASE * 1000 + 20);
            }, DURACION_FASE * 1000 + 16);
        }

        return {
            el: raiz,

            setChar: function (nuevo) {
                if (nuevo === estado.actual && !estado.animando) { return; }
                if (estado.animando) {
                    estado.pendiente = nuevo;
                    return;
                }
                if (nuevo === estado.actual) { return; }
                iniciarFlip(nuevo);
            },

            setColor: function (col) {
                estado.color = col;
                if (!estado.animando) {
                    panelSuperior.setColor(col);
                    panelInferior.setColor(col);
                }
            },

            setSize: function (w, h) {
                var radio = Math.min(w, h) * 0.12;
                raiz.style.width = w + 'px';
                raiz.style.height = h + 'px';

                panelSuperior.setTamano(w, h, radio);
                panelInferior.setTamano(w, h, radio);
                solapaSuperior.setTamano(w, h, radio);
                solapaInferior.setTamano(w, h, radio);

                bisagra.style.width = (w * 0.94) + 'px';
                bisagra.style.height = Math.max(2, h * 0.035) + 'px';
                bisagra.style.left = (w * 0.03) + 'px';
                bisagra.style.top = ((h / 2) - Math.max(2, h * 0.035) / 2) + 'px';

                marco.style.width = w + 'px';
                marco.style.height = h + 'px';
                marco.style.borderRadius = radio + 'px';
            }
        };
    }

    return { crear: crear };
})();
