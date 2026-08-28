//
//  FlipCharacterView.swift
//  CalendarioPerpetuoFlip
//
//  Una única lámina flip (un carácter): dos mitades negras separadas
//  por una bisagra metálica, que giran en dos fases para revelar el
//  siguiente carácter, igual que los paneles de un tablón de
//  aeropuerto/estación.
//

import SwiftUI

struct FlipCharacterView: View {

    /// Carácter que debe mostrarse ahora mismo (p.ej. "M", "3").
    let caracter: String

    /// Color actual de las láminas (blanco = normal, ámbar/rojo = navegación).
    let color: Color

    /// Duración de cada una de las dos fases de la animación.
    private let duracionFase: Double = 0.16

    // ViewModel para notificar inicio/fin de animaciones
    @Environment(\.calendarioViewModel) private var viewModel

    // Carácter realmente "asentado" en el panel trasero (estático) en cada mitad.
    @State private var arribaFondo: String
    @State private var abajoFondo: String

    // Ángulos de las dos solapas animadas (en grados).
    @State private var anguloSolapaSuperior: Double = 0   // 0 -> -90 (cae)
    @State private var anguloSolapaInferior: Double = 90  // 90 -> 0 (se asienta)

    // Carácter que muestran las solapas mientras animan.
    @State private var solapaSuperiorMuestra: String
    @State private var solapaInferiorMuestra: String

    @State private var animando = false
    @State private var pendiente: String?

    init(caracter: String, color: Color) {
        self.caracter = caracter
        self.color = color
        _arribaFondo = State(initialValue: caracter)
        _abajoFondo = State(initialValue: caracter)
        _solapaSuperiorMuestra = State(initialValue: caracter)
        _solapaInferiorMuestra = State(initialValue: caracter)
    }

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            let radio: CGFloat = min(w, h) * 0.12

            ZStack {
                // Mitades estáticas de fondo.
                posicionada(mediaCelda(texto: arribaFondo, esSuperior: true, w: w, h: h, radio: radio), esSuperior: true, w: w, h: h)
                posicionada(mediaCelda(texto: abajoFondo, esSuperior: false, w: w, h: h, radio: radio), esSuperior: false, w: w, h: h)

                // Solapa superior animada: cae desde 0° hasta -90° mostrando
                // el carácter ANTERIOR, con el eje de giro en su borde inferior
                // (la bisagra).
                if animando && anguloSolapaSuperior > -90 {
                    posicionada(
                        mediaCelda(texto: solapaSuperiorMuestra, esSuperior: true, w: w, h: h, radio: radio)
                            .rotation3DEffect(
                                .degrees(anguloSolapaSuperior),
                                axis: (x: 1, y: 0, z: 0),
                                anchor: .bottom,
                                anchorZ: 0,
                                perspective: 0.4
                            )
                            .shadow(color: .black.opacity(0.6), radius: 3, y: 2),
                        esSuperior: true, w: w, h: h
                    )
                }

                // Solapa inferior animada: sube desde 90° hasta 0° mostrando
                // el carácter NUEVO, con el eje de giro en su borde superior.
                if animando && anguloSolapaInferior > 0 {
                    posicionada(
                        mediaCelda(texto: solapaInferiorMuestra, esSuperior: false, w: w, h: h, radio: radio)
                            .rotation3DEffect(
                                .degrees(anguloSolapaInferior),
                                axis: (x: 1, y: 0, z: 0),
                                anchor: .top,
                                anchorZ: 0,
                                perspective: 0.4
                            )
                            .shadow(color: .black.opacity(0.5), radius: 3, y: -1),
                        esSuperior: false, w: w, h: h
                    )
                }

                // Bisagra metálica central.
                bisagra(w: w, h: h)

                // Marco exterior.
                RoundedRectangle(cornerRadius: radio, style: .continuous)
                    .stroke(Color(white: 0.15), lineWidth: 1.5)
            }
        }
        .onChange(of: caracter) { _, nuevo in
            iniciarFlip(hacia: nuevo)
        }
    }

    // MARK: - Piezas visuales

    /// Devuelve, con su tamaño natural (w × h/2), la mitad visible (fondo +
    /// porción correspondiente del carácter) ya recortada. El carácter se
    /// dibuja a tamaño de celda completa (w × h) y se recorta a la mitad
    /// pedida, de forma que la mitad superior y la inferior encajan
    /// perfectamente cuando se superponen.
    private func mediaCelda(texto: String, esSuperior: Bool, w: CGFloat, h: CGFloat, radio: CGFloat) -> some View {
        ZStack(alignment: esSuperior ? .top : .bottom) {
            formaMedia(esSuperior: esSuperior, radio: radio)
                .frame(width: w, height: h / 2)

            Text(texto)
                .font(.system(size: min(h * 0.92, w * 2.10), weight: .bold, design: .monospaced))
                .lineLimit(1)
                .minimumScaleFactor(0.4)
                .foregroundStyle(color)
                .frame(width: w, height: h)
        }
        .frame(width: w, height: h / 2, alignment: esSuperior ? .top : .bottom)
        .clipped()
        .animation(.easeInOut(duration: 0.4), value: color)
    }

    /// Vuelve a "estirar" una mitad (w × h/2) a la altura completa de la
    /// celda (w × h), pegada al borde que le corresponde, para poder
    /// superponerla junto a las demás piezas dentro del ZStack exterior.
    private func posicionada<V: View>(_ vista: V, esSuperior: Bool, w: CGFloat, h: CGFloat) -> some View {
        vista.frame(width: w, height: h, alignment: esSuperior ? .top : .bottom)
    }

    @ViewBuilder
    private func formaMedia(esSuperior: Bool, radio: CGFloat) -> some View {
        if esSuperior {
            UnevenRoundedRectangle(
                topLeadingRadius: radio, bottomLeadingRadius: 0,
                bottomTrailingRadius: 0, topTrailingRadius: radio
            )
            .fill(Color.black)
        } else {
            UnevenRoundedRectangle(
                topLeadingRadius: 0, bottomLeadingRadius: radio,
                bottomTrailingRadius: radio, topTrailingRadius: 0
            )
            .fill(Color.black)
        }
    }

    private func bisagra(w: CGFloat, h: CGFloat) -> some View {
        Rectangle()
            .fill(Color(white: 0.45))
            .frame(width: w * 0.94, height: max(2, h * 0.035))
    }

    // MARK: - Animación de dos fases

    private func iniciarFlip(hacia nuevo: String) {
        guard nuevo != arribaFondo || nuevo != abajoFondo else { return }
        guard !animando else {
            pendiente = nuevo
            return
        }
        
        // Notificar al ViewModel que una animación está iniciando
        viewModel?.notificarInicioAnimacion()
        
        animando = true
        solapaSuperiorMuestra = arribaFondo
        anguloSolapaSuperior = 0
        FlipSoundPlayer.shared.reproducirFlip()

        // Se secuencian las dos fases con Task.sleep en lugar de con los
        // completion de withAnimation(_:completion:): en swipes rápidos,
        // con varias láminas animando a la vez, esos completion a veces no
        // llegaban a dispararse, y la lámina se quedaba con `animando`
        // atascado a true para siempre (dejaba de reaccionar a cambios,
        // efecto "solo cambia la primera letra"). Task.sleep siempre
        // continúa transcurrido el tiempo, así que `animando` nunca se
        // queda colgado.
        Task { @MainActor in
            withAnimation(.easeIn(duration: duracionFase)) {
                anguloSolapaSuperior = -90
            }
            try? await Task.sleep(for: .seconds(duracionFase))

            // La solapa superior ya está de canto (invisible): momento de
            // intercambiar, sin que se note, el fondo superior estático.
            arribaFondo = nuevo
            solapaInferiorMuestra = nuevo
            anguloSolapaInferior = 90
            withAnimation(.easeOut(duration: duracionFase)) {
                anguloSolapaInferior = 0
            }
            try? await Task.sleep(for: .seconds(duracionFase))

            abajoFondo = nuevo
            animando = false
            
            // Notificar al ViewModel que la animación terminó
            viewModel?.notificarFinAnimacion()
            
            if let siguiente = pendiente {
                pendiente = nil
                if siguiente != nuevo {
                    iniciarFlip(hacia: siguiente)
                }
            }
        }
    }
}
