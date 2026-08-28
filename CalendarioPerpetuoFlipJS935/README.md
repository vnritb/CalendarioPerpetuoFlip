# Calendario perpetuo flip — versión JavaScript (iOS 9.3.5 / Safari)

Puerto fiel a JavaScript puro (ES5) + HTML5 + CSS3 de la app SwiftUI
`CalendarioPerpetuoFlip`. Pensada para funcionar dentro de Safari en un
iPad con **iOS 9.3.5**, así que evita deliberadamente cualquier API o
sintaxis que ese Safari no soporte:

- Sin `let`/`const`, clases ES6, arrow functions, template literals ni
  módulos ES (`<script type="module">` no existe hasta Safari 10.1):
  todo con `var`/`function` clásicos y `<script>` normales cargados en
  orden de dependencias.
- Sin CSS Grid ni la propiedad `gap` en flexbox (no soportada hasta
  Safari 14.1): el layout usa flexbox clásico con `margin` para separar
  columnas y filas.
- Sin variables CSS (`--custom-property`): todos los colores están
  escritos directamente.
- Web Audio API con fallback `webkitAudioContext` para Safari antiguo.
- Gestos táctiles con `touchstart`/`touchmove`/`touchend` clásicos (no
  `touch-action`, no `PointerEvent`, no opciones `{passive:false}` en
  `addEventListener`, que tampoco existen en ese Safari).
- Todas las transiciones 3D (`rotateX`) llevan prefijo `-webkit-`.

## Estructura

```
CalendarioPerpetuoFlipJS/
├── index.html                Punto de entrada, monta los 4 "cuadrantes"
├── css/
│   └── estilos.css           Layout, marcos de madera, láminas, reloj
└── js/
    ├── datos.js               Equivalente a CalendarioDatos.swift
    ├── estadoFlip.js          Equivalente a EstadoFlip.swift (colores)
    ├── sonido.js               Equivalente a FlipSoundPlayer.swift (Web Audio)
    ├── maderaTextura.js       Equivalente a WoodTexture (WoodenFrame.swift)
    ├── flipCharacter.js       Equivalente a FlipCharacterView.swift
    ├── flipGroup.js            Equivalente a FlipGroupView.swift
    ├── reloj.js                 Equivalente a AnalogClockView.swift
    ├── viewModel.js            Equivalente a CalendarioViewModel.swift
    └── main.js                  Equivalente a ContentView.swift (arranque, layout, swipe)
```

## Cómo probarlo

Ábrelo servido por HTTP (no con `file://`, para que Web Audio y las
rutas relativas de los `<script>` funcionen bien en todos los Safari):

```bash
cd CalendarioPerpetuoFlipJS
python3 -m http.server 8000
# abrir http://<ip-de-tu-mac>:8000/index.html desde Safari en el iPad
```

En el iPad, añádelo a la pantalla de inicio (icono de compartir →
"Añadir a pantalla de inicio") para que arranque a pantalla completa,
sin barra de Safari, gracias a las meta `apple-mobile-web-app-*` del
`<head>`.

## Qué reproduce del original

- **Layout 2×2**: columna izquierda (reloj arriba, día del mes abajo)
  más estrecha; columna derecha (día de la semana arriba, mes abajo)
  más ancha, proporción 2:3 — igual que en Swift, aquí con
  `flex: 2` / `flex: 3`.
- **Láminas flip**: cada carácter es una celda independiente con dos
  mitades estáticas y dos "solapas" que giran en dos fases
  (`rotateX(0→-90deg)` y luego `rotateX(90→0deg)`) para revelar el
  carácter siguiente, con bisagra metálica central — mismo mecanismo
  visual que `FlipCharacterView.swift`.
- **Sonido**: cada lámina que gira reproduce un "rrrrr…clk!" sintetizado
  en el momento con Web Audio API (ruido modulado + impulso corto), sin
  ningún archivo de audio, igual que `FlipSoundPlayer.swift`. Como
  Safari exige un gesto del usuario para desbloquear audio, el primer
  toque en pantalla desbloquea el contexto.
- **Textura de madera**: se dibuja en un `<canvas>` con gradiente base +
  vetas onduladas + "nudos" generados con el mismo tipo de generador
  pseudoaleatorio que `WoodTexture` en Swift.
- **Swipe**: arrastrar verticalmente sobre cualquier punto de la
  pantalla adelanta/retrasa la fecha (60px = 1 día). El color pasa de
  blanco a ámbar mientras el dedo se mueve, y a rojo durante 6 segundos
  tras soltar, antes de volver automáticamente a blanco con la fecha
  real — mismos umbrales y tiempos que `CalendarioViewModel.swift`.
  Igual que en el original, mientras una lámina está a mitad de su
  animación de flip se bloquean nuevas actualizaciones de swipe, para
  que no se pisen animaciones.
- **Medianoche y verificación horaria**: un `setTimeout` calcula el
  instante exacto de la próxima medianoche para refrescar la fecha real
  automáticamente, y cada hora se revalida que lo mostrado coincida con
  `new Date()` (más una revalidación al volver la pestaña a primer
  plano vía `visibilitychange`/`pageshow`).
- **Reloj analógico**: esfera blanca con agujas y números negros,
  totalmente independiente del estado de swipe/flip, actualizado cada
  segundo.

## Diferencias con la versión nativa (inevitables al ser web)

- Un sitio web no puede forzar la orientación del dispositivo: se
  muestra un aviso a pantalla completa ("Gira el iPad a horizontal")
  cuando el iPad está en vertical, en vez de bloquear la rotación como
  hace `Info.plist` en la app nativa.
- No hay `AVAudioSession` ni control de mezcla con otro audio: se usa
  el comportamiento por defecto de Web Audio en Safari.
- Al no ser una app instalada, no hay notificación de sistema al
  refrescar en segundo plano: la verificación de fecha se apoya en los
  eventos `visibilitychange`/`pageshow` del navegador.

## Tipografía de las láminas

Las láminas usan **IBM Plex Mono Bold**: monoespaciada, de trazo recto
y sin serifas, muy cercana a la de los paneles tipo "Solari" de
aeropuerto/estación (más recta que `Courier New`, que tiene un aire de
máquina de escribir). Se sirve en local, sin depender de ningún CDN:

- `fonts/IBMPlexMono-Bold.woff` (formato principal)
- `fonts/IBMPlexMono-Bold.ttf` (respaldo; WOFF2 no lo soporta Safari
  hasta iOS 12, así que aquí se usa WOFF1/TTF)
- `fonts/OFL.txt` — licencia SIL Open Font License 1.1 de IBM Plex

Si no carga (por ejemplo si borras la carpeta `fonts/`), `css/estilos.css`
cae automáticamente a `'Courier New', Courier, monospace`.

## Ajustes que quizá quieras cambiar

- **Umbral de swipe** (`PUNTOS_POR_DIA`) y **segundos en rojo**
  (`SEGUNDOS_VISTA_PREVIA`): en `js/viewModel.js`.
- **Duración de cada fase del flip** (`DURACION_FASE`): en
  `js/flipCharacter.js`.
- **Colores de fase** (blanco/ámbar/rojo): en `js/estadoFlip.js`.
- **Fuente de las láminas**: cambia la regla `@font-face` y el
  `font-family` de `.flip-panel .flip-texto` en `css/estilos.css`.
