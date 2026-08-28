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
    var elVentanaReloj, elVentanaDiaMes, elVentanaDiaSemana, elVentanaMes;
    var elEspaciadorScroll;

    // Alto extra (px) del hueco vacio al final de la pagina, de mas
    // sobre lo que mide la pantalla, solo para poder hacer scroll y que
    // Safari de iOS oculte su barra de herramientas.
    var ALTO_EXTRA_ESPACIADOR = 100;

    // Mismas proporciones que ContentView.swift (proporcionIzquierda/
    // proporcionDerecha/espaciado/margenExterior), pero calculadas aqui a
    // mano en JS en vez de con flexbox: ver estilos.css para el porque.
    var MARGEN_EXTERIOR = 20;
    var ESPACIADO_LAYOUT = 16;
    var PROPORCION_IZQUIERDA = 2;
    var PROPORCION_DERECHA = 3;

    // OJO con esto: Chrome/Chromium (y todo lo que se basa en el, Edge,
    // Opera, Brave...) siempre lleva en su user-agent el texto fijo
    // "AppleWebKit/537.36" y tambien "Safari/537.36" de compatibilidad,
    // AUNQUE su motor real (Blink) sea mucho mas nuevo. Comparar ese
    // numero a pelo clasificaria erroneamente a Chrome como "WebKit
    // viejo" (537.36 < 601.1). Por eso primero hay que descartar toda la
    // familia Chromium, y solo entonces mirar el numero de AppleWebKit
    // -- ahi si es fiable, porque en el Safari real ese numero SI sube
    // con cada version.
    function esNavegadorSafariReal() {
        var ua = navigator.userAgent;
        if (!/Safari\//.test(ua)) { return false; }
        return !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|EdgA|Edg\/|OPiOS|OPR\//.test(ua);
    }

    function obtenerVersionWebkit() {
        var m = navigator.userAgent.match(/AppleWebKit\/(\d+(?:\.\d+)?)/);
        if (!m) { return null; }
        return parseFloat(m[1]);
    }

    var VERSION_WEBKIT = obtenerVersionWebkit();
    // Solo se desactiva el swipe en Safari REAL con motor <= 601.1 (iOS
    // 9.3.5 y anteriores). Cualquier otro navegador (Chrome, Firefox,
    // Safari mas moderno...) conserva el swipe.
    var SWIPE_DESHABILITADO = esNavegadorSafariReal() && VERSION_WEBKIT !== null && VERSION_WEBKIT <= 601.1;

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
        elEspaciadorScroll = document.getElementById('espaciador-scroll');
        elVentanaReloj = document.getElementById('ventana-reloj');
        elVentanaDiaMes = document.getElementById('ventana-dia-mes');
        elVentanaDiaSemana = document.getElementById('ventana-dia-semana');
        elVentanaMes = document.getElementById('ventana-mes');

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

    // Coloca las 4 ventanas con position:absolute + left/top/width/height
    // en pixeles, calculados a mano (sin flexbox, ver estilos.css).
    // Layout: columna izquierda (reloj arriba, dia del mes abajo) mas
    // estrecha; columna derecha (dia de semana arriba, mes abajo) mas
    // ancha, proporcion 2:3 -- igual que ContentView.swift.
    function ajustarLayoutPrincipal() {
        var w = window.innerWidth;
        var h = window.innerHeight;

        var anchoDisponible = w - MARGEN_EXTERIOR * 2 - ESPACIADO_LAYOUT;
        var sumaProporciones = PROPORCION_IZQUIERDA + PROPORCION_DERECHA;
        var anchoIzquierda = anchoDisponible * PROPORCION_IZQUIERDA / sumaProporciones;
        var anchoDerecha = anchoDisponible * PROPORCION_DERECHA / sumaProporciones;
        var alturaFila = (h - MARGEN_EXTERIOR * 2 - ESPACIADO_LAYOUT) / 2;

        var leftIzquierda = MARGEN_EXTERIOR;
        var leftDerecha = MARGEN_EXTERIOR + anchoIzquierda + ESPACIADO_LAYOUT;
        var topArriba = MARGEN_EXTERIOR;
        var topAbajo = MARGEN_EXTERIOR + alturaFila + ESPACIADO_LAYOUT;

        posicionarVentana(elVentanaReloj, leftIzquierda, topArriba, anchoIzquierda, alturaFila);
        posicionarVentana(elVentanaDiaMes, leftIzquierda, topAbajo, anchoIzquierda, alturaFila);
        posicionarVentana(elVentanaDiaSemana, leftDerecha, topArriba, anchoDerecha, alturaFila);
        posicionarVentana(elVentanaMes, leftDerecha, topAbajo, anchoDerecha, alturaFila);
    }

    function posicionarVentana(el, left, top, ancho, alto) {
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.width = ancho + 'px';
        el.style.height = alto + 'px';
    }

    // El hueco vacio tiene que medir siempre "pantalla completa + un
    // poco", para que SIEMPRE haya de donde hacer scroll (si no, en
    // orientaciones/tamanos donde ya no sobrase espacio, dejaria de
    // poder ocultarse la barra). Se recalcula cada vez que cambia el
    // tamano de la ventana.
    function ajustarEspaciadorScroll() {
        if (!elEspaciadorScroll) { return; }
        elEspaciadorScroll.style.height = (window.innerHeight + ALTO_EXTRA_ESPACIADOR) + 'px';
    }

    // El truco clasico para que Safari de iOS oculte su barra de
    // herramientas: la pagina tiene que ser mas alta que la pantalla
    // (ver #espaciador-scroll) y basta con desplazar el scroll 1px. Como
    // #app es position:fixed, el calendario en si no se mueve ni un
    // pixel; lo unico que cambia es que, una vez oculta la barra,
    // window.innerHeight crece y el "resize" que dispara Safari hace que
    // medirYAjustar() reparta ese espacio de mas.
    function ocultarBarraDelNavegador() {
        window.scrollTo(0, 1);
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

        ajustarEspaciadorScroll();

        // 1) Posicionar las 4 ventanas (sin flexbox, ver arriba).
        ajustarLayoutPrincipal();

        // 2) Con las ventanas ya colocadas, medir su hueco interior real
        //    y ajustar lo que va dentro (laminas / reloj).
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
        var sonidoDesbloqueado = false;

        function desbloquearSonido() {
            if (!sonidoDesbloqueado) {
                Sonido.desbloquear();
                sonidoDesbloqueado = true;
            }
        }

        if (SWIPE_DESHABILITADO) {
            // Motores AppleWebKit <= 601.1 (Safari de iOS 9.3.5 y
            // anteriores): sin gesto de swipe manual. Solo queda un
            // touchstart minimo para desbloquear el audio, y un
            // touchmove que traga el evento para que el dedo no arrastre
            // la pagina (recordar: la pagina es mas alta que la pantalla
            // a proposito, para ocultar la barra de Safari).
            app.addEventListener('touchstart', function (e) {
                if (e.touches.length !== 1) { return; }
                desbloquearSonido();
            }, false);
            app.addEventListener('touchmove', function (e) {
                if (e.cancelable) { e.preventDefault(); }
            }, false);
            return;
        }

        var arrastrandoDedo = false;
        var yInicial = 0;

        function inicio(y) {
            arrastrandoDedo = true;
            yInicial = y;
            desbloquearSonido();
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
            // Tras girar el iPad, Safari puede volver a mostrar su barra:
            // se recalcula el layout y se intenta ocultar otra vez.
            setTimeout(function () {
                medirYAjustar();
                ocultarBarraDelNavegador();
            }, 300);
        }, false);

        // Al volver de segundo plano tambien puede reaparecer la barra.
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                setTimeout(ocultarBarraDelNavegador, 200);
            }
        }, false);
        window.addEventListener('pageshow', function () {
            setTimeout(ocultarBarraDelNavegador, 200);
        }, false);
    }

    function iniciarApp() {
        construirDOM();
        conectarViewModel();
        conectarSwipe();
        conectarRedimension();
        medirYAjustar();
        ViewModel.iniciar();

        // Primer intento nada mas arrancar...
        ocultarBarraDelNavegador();
    }

    // ...y otro tras "load" (con la pagina ya completamente pintada, que
    // es cuando este truco funciona de forma mas fiable en Safari viejo),
    // mas un tercer intento de repuesto un poco despues por si el primero
    // llega demasiado pronto.
    window.addEventListener('load', function () {
        ocultarBarraDelNavegador();
        setTimeout(ocultarBarraDelNavegador, 300);
    }, false);

    alListo(iniciarApp);
})();
