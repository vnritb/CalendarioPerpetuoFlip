//
//  CalendarioDatos.swift
//  CalendarioPerpetuoFlip
//
//  Datos y utilidades de calendario en español: abreviaturas de días
//  de la semana y meses, y funciones de cálculo de fecha usadas por
//  todo el resto de la app.
//

import Foundation

enum CalendarioDatos {

    /// Abreviaturas de los días de la semana, en el mismo orden que
    /// `Calendar.Component.weekday` de Foundation (1 = domingo ... 7 = sábado).
    static let diasSemana: [String] = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"]

    /// Abreviaturas de los meses, índice 0 = enero ... 11 = diciembre.
    static let meses: [String] = [
        "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
        "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"
    ]

    /// Calendario gregoriano fijado a la zona horaria del dispositivo,
    /// usado para todos los cálculos de la app (medianoche, suma de días, etc).
    static let calendario: Calendar = {
        var cal = Calendar(identifier: .gregorian)
        cal.locale = Locale(identifier: "es_ES")
        cal.timeZone = TimeZone.current
        return cal
    }()

    struct Componentes {
        let diaSemanaAbrev: String
        let diaMes: Int
        let mesAbrev: String
    }

    /// Extrae día de la semana, día del mes y mes (abreviados) de una fecha.
    static func componentes(de fecha: Date) -> Componentes {
        let comps = calendario.dateComponents([.day, .month, .weekday], from: fecha)
        let diaMes = comps.day ?? 1
        let mesIdx = max(0, min(11, (comps.month ?? 1) - 1))
        let semanaIdx = max(0, min(6, (comps.weekday ?? 1) - 1))
        return Componentes(
            diaSemanaAbrev: diasSemana[semanaIdx],
            diaMes: diaMes,
            mesAbrev: meses[mesIdx]
        )
    }

    /// Suma (o resta, si es negativo) un número de días a una fecha.
    static func sumarDias(_ dias: Int, a fecha: Date) -> Date {
        calendario.date(byAdding: .day, value: dias, to: fecha) ?? fecha
    }

    /// Medianoche (00:00) del día que contiene `fecha`.
    static func inicioDelDia(_ fecha: Date) -> Date {
        calendario.startOfDay(for: fecha)
    }

    /// Instante de la próxima medianoche a partir de `fecha`.
    static func proximaMedianoche(desde fecha: Date) -> Date {
        let hoy = inicioDelDia(fecha)
        return calendario.date(byAdding: .day, value: 1, to: hoy) ?? fecha.addingTimeInterval(86_400)
    }

    /// Los 2 dígitos del día del mes, con cero a la izquierda, como caracteres sueltos.
    static func digitosDia(_ diaMes: Int) -> [String] {
        let texto = String(format: "%02d", max(1, min(31, diaMes)))
        return texto.map { String($0) }
    }

    /// Los 3 caracteres de una abreviatura (día de la semana o mes) como array.
    static func caracteres(_ abreviatura: String) -> [String] {
        Array(abreviatura).map { String($0) }
    }

    // MARK: - Validación de coherencia

    /// Valida que los componentes de una instantánea sean coherentes entre sí.
    /// Verifica que el día de la semana, día del mes y mes sean valores válidos
    /// y que correspondan a una fecha real calculada.
    /// - Returns: `true` si la combinación de día de semana, día del mes y mes es válida.
    static func sonComponentesValidos(
        diaSemana: [String],
        diaMes: [String],
        mes: [String]
    ) -> Bool {
        // 1. Verificar que el día de la semana sea uno de los valores permitidos
        let diaSemanaTexto = diaSemana.joined()
        guard diasSemana.contains(diaSemanaTexto) else {
            print("❌ Día de semana inválido: '\(diaSemanaTexto)'")
            return false
        }

        // 2. Verificar que el mes sea uno de los valores permitidos
        let mesTexto = mes.joined()
        guard let mesIdx = meses.firstIndex(of: mesTexto) else {
            print("❌ Mes inválido: '\(mesTexto)'")
            return false
        }

        // 3. Verificar que el día del mes sea un número válido
        let diaMesTexto = diaMes.joined()
        guard let diaMesNumero = Int(diaMesTexto), diaMesNumero >= 1 else {
            print("❌ Día del mes inválido: '\(diaMesTexto)'")
            return false
        }

        // 4. Verificar que el día del mes no exceda el número de días del mes
        // usando el año actual (importante para años bisiestos)
        let year = calendario.component(.year, from: Date())
        var components = DateComponents()
        components.year = year
        components.month = mesIdx + 1  // meses es 0-indexed, Calendar.month es 1-indexed
        components.day = diaMesNumero

        // Intentar crear una fecha con estos componentes
        guard let fechaReconstruida = calendario.date(from: components) else {
            print("❌ No se puede construir fecha: día \(diaMesNumero), mes \(mesIdx + 1), año \(year)")
            return false
        }

        // 5. Verificar que los componentes de la fecha reconstruida coincidan
        // con los originales (esto detecta casos como "31 de febrero")
        let compReconstruidos = calendario.dateComponents([.day, .month, .weekday], from: fechaReconstruida)
        
        if compReconstruidos.day != diaMesNumero {
            print("❌ Día del mes no coincide tras reconstrucción: esperado \(diaMesNumero), obtenido \(compReconstruidos.day ?? -1)")
            return false
        }
        
        if compReconstruidos.month != mesIdx + 1 {
            print("❌ Mes no coincide tras reconstrucción: esperado \(mesIdx + 1), obtenido \(compReconstruidos.month ?? -1)")
            return false
        }

        // 6. Verificar que el día de la semana coincida con la fecha reconstruida
        let semanaIdxReconstruido = max(0, min(6, (compReconstruidos.weekday ?? 1) - 1))
        let diaSemanaEsperado = diasSemana[semanaIdxReconstruido]
        
        if diaSemanaTexto != diaSemanaEsperado {
            print("❌ Día de semana no coincide: mostrado '\(diaSemanaTexto)', esperado '\(diaSemanaEsperado)' para \(diaMesNumero)/\(mesIdx + 1)/\(year)")
            return false
        }

        print("✅ Validación exitosa: \(diaSemanaTexto) \(diaMesNumero) \(mesTexto)")
        return true
    }
}
