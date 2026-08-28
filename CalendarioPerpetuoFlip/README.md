# Calendario perpetuo flip

App para iPad, en modo apaisado, que muestra un calendario perpetuo de tipo
"flip" (tipo tablón de aeropuerto/estación): día de la semana, día del mes
y mes en láminas negras con texto blanco que giran sobre una bisagra
metálica, junto con un reloj analógico. Todo el texto está en español y la
interfaz está construida con SwiftUI.

## Requisitos

- macOS con Xcode 15 o posterior (recomendado Xcode 16/17).
- iPadOS 17 o posterior (deployment target del proyecto: iOS 17.0).
- No hace falta ningún paquete ni dependencia externa: el proyecto no usa
  CocoaPods, Swift Package Manager de terceros ni ningún asset de audio o
  imagen descargado. Todo el sonido y la textura de madera se generan por
  código.

## Estructura del proyecto

```
CalendarioPerpetuoFlip/
├── CalendarioPerpetuoFlip.xcodeproj/       Proyecto de Xcode
└── CalendarioPerpetuoFlip/                 Código fuente de la app
    ├── CalendarioPerpetuoFlipApp.swift     Punto de entrada (@main)
    ├── Info.plist                          Orientación apaisada, sin barra de estado, etc.
    ├── Models/
    │   ├── CalendarioDatos.swift           Abreviaturas ES y cálculo de fechas
    │   └── EstadoFlip.swift                Estado/color de las láminas
    ├── ViewModels/
    │   └── CalendarioViewModel.swift       Fecha real, swipe, medianoche, reloj
    ├── Views/
    │   ├── ContentView.swift               Layout de los 4 cuadrantes
    │   ├── FlipCharacterView.swift         Una lámina flip individual (con bisagra)
    │   ├── FlipGroupView.swift             Fila de láminas (día semana / mes / número)
    │   ├── AnalogClockView.swift           Reloj analógico (blanco y negro invertido)
    │   └── WoodenFrame.swift               Textura de madera + marco tipo reloj de ajedrez
    ├── Audio/
    │   └── FlipSoundPlayer.swift           Sonido "rrrrr...clk!" sintetizado con AVAudioEngine
    └── Assets.xcassets/                    AppIcon y color de acento
```

## Cómo abrir y compilar el proyecto

1. Copia (o clona) la carpeta `CalendarioPerpetuoFlip` a tu Mac.
2. Haz doble clic en `CalendarioPerpetuoFlip.xcodeproj` para abrirlo con
   Xcode (o desde Xcode: **File > Open...** y selecciona el `.xcodeproj`).
3. Xcode generará automáticamente su `project.xcworkspace` interno la
   primera vez que abras el proyecto; no hace falta hacer nada más.

## Cómo probarlo en el simulador de iPad (en el mismo Mac)

1. En la barra superior de Xcode, junto al botón de ▶️ Run, pulsa el
   selector de destino (donde normalmente pone el nombre de un dispositivo).
2. Elige cualquier simulador de iPad, por ejemplo **iPad Pro 13-inch (M4)**
   o **iPad Air 11-inch (M2)** (la lista depende de las versiones de
   iPadOS que tengas descargadas en Xcode; si no aparece ninguno, abre
   **Xcode > Settings > Platforms** y descarga una versión de iOS/iPadOS
   Simulator).
3. Pulsa ▶️ Run (o `Cmd + R`). Xcode compilará la app y abrirá el
   simulador con **Calendario perpetuo flip** ya en marcha.
4. El simulador arranca en vertical por defecto: gira la ventana del
   simulador a apaisado con `Cmd + →` o `Cmd + ←` (menú **Device >
   Rotate Left/Right**), o simplemente redimensiona la ventana; la app
   está fijada a orientación apaisada (`UIRequiresFullScreen` +
   orientaciones landscape en el `Info.plist`), así que el sistema no la
   dejará mostrarse en vertical.
5. Para simular el gesto de swipe con el ratón: haz clic y arrastra
   verticalmente sobre cualquiera de los tres cuadrantes de láminas
   (día de la semana, día del mes o mes) — **no** sobre el reloj, que es
   el único cuadrante que ignora el gesto.
6. Para comprobar el cambio automático a medianoche sin esperar: usa
   **Features > Date and Time...** en el simulador (o cambia la fecha del
   Mac) para adelantar el reloj del sistema y observar el efecto de flip
   con sonido al cruzar la medianoche.

## Cómo probarlo en un iPad físico

1. Conecta el iPad al Mac por cable, o añádelo como dispositivo
   inalámbrico (**Xcode > Window > Devices and Simulators**).
2. Selecciona el proyecto **CalendarioPerpetuoFlip** en el navegador de
   Xcode, pestaña **Signing & Capabilities**:
   - Marca **Automatically manage signing**.
   - En **Team**, elige tu Apple ID / equipo de desarrollador (si no
     tienes ninguno añadido, hazlo desde **Xcode > Settings > Accounts**;
     una cuenta gratuita de Apple ID es suficiente para probar en tu
     propio dispositivo).
   - Xcode generará un `Bundle Identifier` de prueba a partir de
     `com.victornaranjo.calendarioperpetuoflip`; si ya usas ese
     identificador en otro proyecto, cámbialo por uno propio (por
     ejemplo `com.tunombre.calendarioperpetuoflip`).
3. Elige tu iPad en el selector de destino (junto al botón ▶️ Run) y
   pulsa `Cmd + R`.
4. La primera vez, el iPad pedirá confiar en el certificado de
   desarrollador: en el iPad ve a **Ajustes > General > VPN y gestión de
   dispositivos**, y confía en tu Apple ID/equipo.
5. Con una cuenta gratuita, la app dejará de poder ejecutarse pasados 7
   días y habrá que reinstalarla desde Xcode; con una cuenta de pago del
   Apple Developer Program no hay ese límite.

## Cómo funciona (resumen de las decisiones de diseño)

- **Layout**: la pantalla se reparte en 2 filas × 2 columnas. Columna
  izquierda (reloj arriba, día del mes abajo) más estrecha; columna
  derecha (día de la semana arriba, mes abajo) más ancha, en proporción
  2:3, tal como se pidió.
- **Láminas flip**: cada carácter es una `FlipCharacterView` independiente,
  con una mitad superior y una mitad inferior separadas por una bisagra
  metálica dibujada con gradientes. Al cambiar el carácter, una solapa
  con el carácter antiguo gira hacia abajo (0° → -90°) revelando el
  fondo con el carácter nuevo, y a continuación una segunda solapa con
  el carácter nuevo gira desde arriba (90° → 0°) hasta asentarse. Esto
  reproduce el mecanismo real de un panel tipo aeropuerto.
- **Sonido**: `FlipSoundPlayer` genera con `AVAudioEngine` un buffer de
  audio en memoria (ruido modulado para el "rrrrr" del trinquete, más un
  impulso corto para el "clk!" final), sin usar ningún archivo de audio.
  Suena una vez por cada lámina que gira.
- **Textura de madera**: `WoodTexture` dibuja un degradado marrón más
  vetas y "nudos" procedurales con `Canvas`, sin ninguna imagen externa.
- **Swipe**: el gesto vertical se reconoce en los tres cuadrantes de
  láminas (no en el reloj). Deslizar hacia arriba retrasa el día,
  deslizar hacia abajo lo adelanta; el color pasa de blanco a un gris
  oscuro, luego a ámbar y finalmente a rojo según la magnitud del
  desplazamiento (umbrales en `FaseColorFlip`, ajustables). Al soltar el
  dedo, la fecha alcanzada se mantiene en rojo 10 segundos y luego
  vuelve automáticamente a la fecha real en blanco.
- **Medianoche**: un `Timer` calcula el instante exacto de la próxima
  medianoche y, al llegar, refresca la fecha real con animación y sonido
  (salvo que en ese momento haya una vista previa de swipe activa).
- **Reloj analógico**: se actualiza cada segundo con su propio `Timer`,
  totalmente aislado del estado de swipe/flip.

## Ajustes que quizá quieras cambiar

- **Bundle Identifier**: cámbialo en *Signing & Capabilities* si vas a
  publicar la app o si el identificador por defecto choca con otro
  proyecto tuyo.
- **Multitarea en iPad**: el `Info.plist` fuerza `UIRequiresFullScreen`
  para que la app siempre ocupe toda la pantalla (como un calendario de
  sobremesa real) y no se pueda usar en Split View/Slide Over. Si
  prefieres permitir multitarea, borra la clave
  `UIRequiresFullScreen` del `Info.plist`.
- **Umbrales de color del swipe** y **píxeles por día**: están en
  `EstadoFlip.swift` (`FaseColorFlip.para`) y en
  `CalendarioViewModel.swift` (`puntosPorDia`), respectivamente.

## Este proyecto se ha generado sin macOS

Este `.xcodeproj` se ha escrito directamente en formato de texto (no se
ha generado con Xcode ni con herramientas como XcodeGen, porque no había
ningún Mac disponible en el entorno donde se creó). Se ha comprobado que
la sintaxis del `project.pbxproj` es válida (llaves, paréntesis y
referencias entre objetos equilibrados), pero, al no haber podido
compilarlo en un Xcode real antes de entregarlo, la primera vez que lo
abras conviene compilar (`Cmd + B`) antes de dar por hecho que todo está
perfecto. Si Xcode se queja de algo puntual (por ejemplo, un ajuste de
firma), suele bastar con corregirlo desde la propia interfaz de Xcode
sin tocar el `project.pbxproj` a mano.
