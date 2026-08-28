//
//  FlipGroupView.swift
//  CalendarioPerpetuoFlip
//
//  Agrupa varias láminas FlipCharacterView en fila para formar una
//  palabra (día de la semana o mes, 3 caracteres) o un número
//  (día del mes, 2 dígitos).
//

import SwiftUI

struct FlipGroupView: View {
    let caracteres: [String]
    let color: Color
    var espaciado: CGFloat = 6

    var body: some View {
        GeometryReader { geo in
            HStack(spacing: espaciado) {
                ForEach(Array(caracteres.enumerated()), id: \.offset) { _, c in
                    FlipCharacterView(caracter: c, color: color)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
    }
}
