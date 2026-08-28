/*
 * main.js
 * Equivalente JS de ContentView.swift + CalendarioPerpetuoFlipApp.swift:
 * construye los 3 grupos flip y el reloj, los monta en las 4 "ventanas",
 * mide sus tamanos reales (como GeometryReader) y conecta el gesto de
 * swipe vertical con touch events clasicos (compatibles con iOS 9.3.5).
 */
(function () {
    'use strict';

    var grupoDiaSemana, grupoDiaMes, grupoMes, reloj;
    var mountReloj, mountDiaSemana, mountDiaMes, mountMes, canvasMadera;

    function alListo(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(fn, 0);
        } else {
            document.addEventListener('DOMContentLoaded', fn, false);
        }
    }

    // Aviso de errores en pantalla: en un iPad viejo no siempre es facil
    // conectar el inspector remoto de Safari. Si algo falla en JS, se ve
    // una franja roja abajo del todo con el mensaje, para poder hacer una
    // captura y saber exactamente que ha pasado.
    function mostrarErrorEnPantalla(msg) {
        var el = document.getElementById('debug-error');
        if (!el) {
            el = document.createElement('div');
            el.id = 'debug-error';
            el.style.position = 'fixed';
            el.style.left = '0';
            el.style.right = '0';
            el.style.bottom = '0';
            el.style.zIndex = '9999';
            el.style.background = 'rgba(190,20,20,0.92)';
            el.style.color = '#ffffff';
            el.style.fontFamily = 'Courier, monospace';
            el.style.fontSize = '11px';
            el.style.padding = '5px 8px';
            document.body.appendChild(el);
        }
        el.textContent = msg;
    }

    window.addEventListener('error', function (e) {
        var msg = 'JS error: ' + e.message + ' (' + e.filename + ':' + e.lineno + ')';
        mostrarErrorEnPantalla(msg);
    }, false);

    function construirDOM() {
        mountReloj = document.getElementById('mount-reloj');
        mountDiaSemana = document.getElementById('mount-dia-semana');
        mountDiaMes = document.getElementById('mount-dia-mes');
        mountMes = document.getElementById('mount-mes');
        canvasMadera = document.getElementById('madera');

        grupoDiaSemana = FlipGroup.crear(3, ViewModel.notificarInicioAnimacion, ViewModel.notificarFinAnimacion);
        grupoDiaMes = FlipGroup.crear(2, ViewModel.notificarInicioAnimacion, ViewModel.notificarFinAnimacion);
        grupoMes = FlipGroup.crear(3, ViewModel.notificarInicioAnimacion, ViewModel.notificarFinAnimacion);
        reloj = Reloj.crear();

        mountDiaSemana.appendChild(grupoDiaSemana.el);
        mountDiaMes.appendChild(grupoDiaMes.el);
        mountMes.appendChild(grupoMes.el);
        mountReloj.appendChild(reloj.el);
    }

    function medirYAjustar() {
        // Reajustar el <canvas> de madera a la resolucion real de pantalla.
        var ancho = window.innerWidth;
        var alto = window.innerHeight;
        if (canvasMadera.width !== ancho || canvasMadera.height !== alto) {
            canvasMadera.width = ancho;
            canvasMadera.height = alto;
        }
        Madera.dibujar(canvasMadera);

        ajustarGrupo(grupoDiaSemana, mountDiaSemana);
        ajustarGrupo(grupoDiaMes, mountDiaMes);
        ajustarGrupo(grupoMes, mountMes);

        var rectReloj = mountReloj.getBoundingClientRect();
        reloj.setSize(rectReloj.width, rectReloj.height);
    }

    function ajustarGrupo(grupo, contenedor) {
        var rect = contenedor.getBoundingClientRect();
        grupo.setSize(rect.width, rect.height);
    }

    var coloresPorFase = {
        normal: EstadoFlip.normal,
        arrastrando: EstadoFlip.arrastrando,
        alerta: EstadoFlip.alerta
    };

    function conectarViewModel() {
        ViewModel.onInstantanea(function (inst) {
            var color = coloresPorFase[inst.fase] || EstadoFlip.normal;
            grupoDiaSemana.setColor(color);
            grupoDiaMes.setColor(color);
            grupoMes.setColor(color);

            grupoDiaSemana.setCaracteres(inst.diaSemana);
            grupoDiaMes.setCaracteres(inst.diaMes);
            grupoMes.setCaracteres(inst.mes);
        });

        ViewModel.onHora(function (hora) {
            reloj.actualizar(hora);
        });
    }

    // --- Gesto de swipe vertical (equivalente a DragGesture en Swift) ---

    function conectarSwipe() {
        var app = document.getElementById('app');
        var arrastrandoDedo = false;
        var yInicial = 0;
        var sonidoDesbloqueado = false;

        function inicio(y) {
            arrastrandoDedo = true;
            yInicial = y;
            if (!sonidoDesbloqueado) {
                Sonido.desbloquear();
                sonidoDesbloqueado = true;
            }
        }

        function mover(y) {
            if (!arrastrandoDedo) { return; }
            ViewModel.arrastreEnCurso(y - yInicial);
        }

        function fin() {
            if (!arrastrandoDedo) { return; }
            arrastrandoDedo = false;
            ViewModel.arrastreFinalizado();
        }

        app.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) { return; }
            inicio(e.touches[0].clientY);
        }, false);

        app.addEventListener('touchmove', function (e) {
            if (!arrastrandoDedo) { return; }
            if (e.cancelable) { e.preventDefault(); }
            mover(e.touches[0].clientY);
        }, false);

        app.addEventListener('touchend', function () {
            fin();
        }, false);

        app.addEventListener('touchcancel', function () {
            fin();
        }, false);

        // Fallback con raton, util para probar en un navegador de escritorio.
        app.addEventListener('mousedown', function (e) {
            inicio(e.clientY);
            e.preventDefault();
        }, false);
        document.addEventListener('mousemove', function (e) {
            mover(e.clientY);
        }, false);
        document.addEventListener('mouseup', function () {
            fin();
        }, false);
    }

    function conectarRedimension() {
        var pendiente = null;
        function programar() {
            if (pendiente) { clearTimeout(pendiente); }
            pendiente = setTimeout(medirYAjustar, 80);
        }
        window.addEventListener('resize', programar, false);
        window.addEventListener('orientationchange', function () {
            setTimeout(medirYAjustar, 300);
        }, false);
    }

    function iniciarApp() {
        construirDOM();
        conectarViewModel();
        conectarSwipe();
        conectarRedimension();
        medirYAjustar();
        ViewModel.iniciar();
    }

    alListo(iniciarApp);
})();
