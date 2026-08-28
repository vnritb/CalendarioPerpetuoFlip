//
//  WoodenFrame.swift
//  CalendarioPerpetuoFlip
//
//  Textura de madera procedural (sin imágenes) y el marco tipo
//  "reloj de ajedrez" que enmarca cada una de las cuatro ventanitas
//  (reloj, día de la semana, día del mes y mes).
//

import SwiftUI

/// Fondo de madera dibujado a mano con gradientes y vetas, para no
/// depender de ningún recurso de imagen externo.
struct WoodTexture: View {
    var tonoBase: Color = Color(red: 0.36, green: 0.22, blue: 0.12)
    var tonoClaro: Color = Color(red: 0.52, green: 0.33, blue: 0.18)
    var tonoOscuro: Color = Color(red: 0.22, green: 0.12, blue: 0.06)

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height

            ZStack {
                LinearGradient(
                    colors: [tonoClaro, tonoBase, tonoOscuro],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )

                Canvas { contexto, tamaño in
                    var semilla: UInt64 = 987_654_321
                    func siguiente() -> Double {
                        semilla = semilla &* 6_364_136_223_846_793_005 &+ 1
                        return Double((semilla >> 33) & 0xFFFF) / Double(0xFFFF)
                    }

                    let numVetas = 26
                    for i in 0..<numVetas {
                        let yBase = tamaño.height * CGFloat(i) / CGFloat(numVetas)
                        var trazo = Path()
                        trazo.move(to: CGPoint(x: 0, y: yBase))
                        let pasos = 10
                        for p in 1...pasos {
                            let x = tamaño.width * CGFloat(p) / CGFloat(pasos)
                            let ondulacion = CGFloat(siguiente() - 0.5) * tamaño.height * 0.035
                            trazo.addLine(to: CGPoint(x: x, y: yBase + ondulacion))
                        }
                        let opacidad = 0.06 + siguiente() * 0.10
                        contexto.stroke(
                            trazo,
                            with: .color(Color.black.opacity(opacidad)),
                            lineWidth: 1 + CGFloat(siguiente()) * 1.5
                        )
                    }

                    let nudos = 4
                    for _ in 0..<nudos {
                        let cx = CGFloat(siguiente()) * tamaño.width
                        let cy = CGFloat(siguiente()) * tamaño.height
                        let r = 4 + CGFloat(siguiente()) * 10
                        let rect = CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2)
                        contexto.stroke(Path(ellipseIn: rect), with: .color(.black.opacity(0.18)), lineWidth: 1.5)
                        let rectInterior = rect.insetBy(dx: r * 0.45, dy: r * 0.45)
                        contexto.fill(Path(ellipseIn: rectInterior), with: .color(.black.opacity(0.15)))
                    }
                }

                RadialGradient(
                    colors: [Color.black.opacity(0.0), Color.black.opacity(0.35)],
                    center: .center, startRadius: min(w, h) * 0.3, endRadius: max(w, h) * 0.75
                )
            }
        }
    }
}

/// Ventanita empotrada en el marco de madera que contiene un cuadrante
/// (reloj o grupo de láminas flip), con bisel oscuro y tornillos en
/// las esquinas, al estilo de la caja de un reloj de ajedrez.
struct VentanaMarco<Contenido: View>: View {
    @ViewBuilder var contenido: Contenido

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(
                    LinearGradient(
                        colors: [Color(white: 0.08), Color(white: 0.02)],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .shadow(color: .black.opacity(0.6), radius: 6, x: 0, y: 3)

            contenido
                .padding(14)

            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(Color(white: 0.35), lineWidth: 2)
                .padding(1)
        }
        .overlay(alignment: .topLeading) { tornilloEsquina }
        .overlay(alignment: .topTrailing) { tornilloEsquina }
        .overlay(alignment: .bottomLeading) { tornilloEsquina }
        .overlay(alignment: .bottomTrailing) { tornilloEsquina }
    }

    private var tornillo: some View {
        Circle()
            .fill(
                RadialGradient(colors: [Color(white: 0.75), Color(white: 0.25)], center: .topLeading, startRadius: 0, endRadius: 8)
            )
            .frame(width: 8, height: 8)
    }

    private var tornilloEsquina: some View {
        tornillo.padding(8)
    }
}
