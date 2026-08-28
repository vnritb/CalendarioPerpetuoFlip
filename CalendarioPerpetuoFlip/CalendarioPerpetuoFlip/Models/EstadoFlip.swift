//
//  EstadoFlip.swift
//  CalendarioPerpetuoFlip
//
//  Estado visual compartido por los tres cuadrantes de tipo flip
//  (día de la semana, día del mes y mes). El reloj analógico NO
//  usa este estado: es completamente independiente.
//

import SwiftUI

/// Fase de color de las láminas: blanco en reposo, amarillo mientras el
/// dedo está arrastrando, y rojo desde que se suelta hasta que expiran
/// los 10 segundos de vista previa.
enum FaseColorFlip: Equatable {
    case normal        // blanco: fecha real, sin interacción
    case arrastrando    // amarillo: mientras el dedo se mueve por la pantalla
    case alerta          // rojo: fecha "en pausa" tras soltar el dedo, durante 10s

    var color: Color {
        switch self {
        case .normal:      return .white
        case .arrastrando: return Color(red: 1.0, green: 0.82, blue: 0.15)
        case .alerta:      return Color(red: 0.92, green: 0.16, blue: 0.16)
        }
    }
}

/// Snapshot inmutable de lo que debe mostrar cada cuadrante flip en
/// un instante dado: los caracteres de cada láminas y el color.
struct InstantaneaFlip: Equatable {
    let diaSemana: [String]   // 3 caracteres, p.ej. ["M","I","E"]
    let diaMes: [String]      // 2 caracteres, p.ej. ["0","3"]
    let mes: [String]         // 3 caracteres, p.ej. ["M","A","R"]
    let fase: FaseColorFlip

    static func desde(fecha: Date, fase: FaseColorFlip) -> InstantaneaFlip {
        let comp = CalendarioDatos.componentes(de: fecha)
        return InstantaneaFlip(
            diaSemana: CalendarioDatos.caracteres(comp.diaSemanaAbrev),
            diaMes: CalendarioDatos.digitosDia(comp.diaMes),
            mes: CalendarioDatos.caracteres(comp.mesAbrev),
            fase: fase
        )
    }
}
