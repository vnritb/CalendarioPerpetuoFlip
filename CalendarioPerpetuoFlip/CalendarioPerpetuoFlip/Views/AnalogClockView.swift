//
//  AnalogClockView.swift
//  CalendarioPerpetuoFlip
//
//  Reloj analógico clásico: esfera blanca, agujas y números negros.
//  Contraste invertido respecto a las láminas flip (que son blancas
//  sobre negro). Se refresca cada segundo y no se ve afectado nunca
//  por el gesto de swipe de los otros cuadrantes.
//

import SwiftUI

struct AnalogClockView: View {
    let hora: Date

    private var calendario: Calendar { CalendarioDatos.calendario }

    var body: some View {
        GeometryReader { geo in
            let lado = min(geo.size.width, geo.size.height) * 0.92
            let comp = calendario.dateComponents([.hour, .minute, .second, .nanosecond], from: hora)
            let h = Double(comp.hour ?? 0)
            let m = Double(comp.minute ?? 0)
            let s = Double(comp.second ?? 0)
            let ns = Double(comp.nanosecond ?? 0)

            let anguloSegundero = (s + ns / 1_000_000_000) / 60 * 360
            let anguloMinutero = (m + s / 60) / 60 * 360
            let anguloHorario = (h.truncatingRemainder(dividingBy: 12) + m / 60) / 12 * 360

            ZStack {
                Circle()
                    .fill(Color.white)
                    .frame(width: lado, height: lado)
                    .overlay(Circle().stroke(Color.black, lineWidth: lado * 0.02))

                ForEach(0..<60, id: \.self) { marca in
                    esferaMarcador(indice: marca, lado: lado)
                }

                ForEach(1...12, id: \.self) { numero in
                    numeroEsfera(numero: numero, lado: lado, centro: CGPoint(x: geo.size.width / 2, y: geo.size.height / 2))
                }

                aguja(longitud: lado * 0.32, grosor: lado * 0.035, angulo: anguloHorario)
                aguja(longitud: lado * 0.44, grosor: lado * 0.025, angulo: anguloMinutero)
                aguja(longitud: lado * 0.46, grosor: lado * 0.008, angulo: anguloSegundero, color: .black)

                Circle()
                    .fill(Color.black)
                    .frame(width: lado * 0.045, height: lado * 0.045)
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }

    @ViewBuilder
    private func esferaMarcador(indice: Int, lado: CGFloat) -> some View {
        let esHora = indice % 5 == 0
        Rectangle()
            .fill(Color.black)
            .frame(width: esHora ? lado * 0.012 : lado * 0.006,
                   height: esHora ? lado * 0.045 : lado * 0.02)
            .offset(y: -lado * 0.44)
            .rotationEffect(.degrees(Double(indice) * 6))
    }

    @ViewBuilder
    private func numeroEsfera(numero: Int, lado: CGFloat, centro: CGPoint) -> some View {
        let angulo = Double(numero) * 30 - 90
        let radio = lado * 0.36
        Text("\(numero)")
            .font(.system(size: lado * 0.09, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.black)
            .position(
                x: centro.x + radio * cos(angulo * .pi / 180),
                y: centro.y + radio * sin(angulo * .pi / 180)
            )
    }

    private func aguja(longitud: CGFloat, grosor: CGFloat, angulo: Double, color: Color = .black) -> some View {
        RoundedRectangle(cornerRadius: grosor / 2)
            .fill(color)
            .frame(width: grosor, height: longitud)
            .offset(y: -longitud / 2)
            .rotationEffect(.degrees(angulo))
    }
}
