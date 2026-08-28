//
//  ContentView.swift
//  CalendarioPerpetuoFlip
//
//  Pantalla principal: reparte la pantalla en 4 cuadrantes (2 filas x
//  2 columnas) dentro de un marco de madera. Columna izquierda (reloj
//  arriba, día del mes abajo) más estrecha; columna derecha (día de
//  la semana arriba, mes abajo) más ancha, proporción 2:3.
//

import SwiftUI

/// Clave de entorno para acceder al ViewModel desde cualquier vista hija.
private struct CalendarioViewModelKey: EnvironmentKey {
    static let defaultValue: CalendarioViewModel? = nil
}

extension EnvironmentValues {
    var calendarioViewModel: CalendarioViewModel? {
        get { self[CalendarioViewModelKey.self] }
        set { self[CalendarioViewModelKey.self] = newValue }
    }
}

struct ContentView: View {
    @State private var vm = CalendarioViewModel()

    private let proporcionIzquierda: CGFloat = 2
    private let proporcionDerecha: CGFloat = 3
    private let espaciado: CGFloat = 16
    private let margenExterior: CGFloat = 20

    var body: some View {
        GeometryReader { geo in
            let anchoDisponible = geo.size.width - margenExterior * 2 - espaciado
            let anchoIzquierda = anchoDisponible * proporcionIzquierda / (proporcionIzquierda + proporcionDerecha)
            let anchoDerecha = anchoDisponible * proporcionDerecha / (proporcionIzquierda + proporcionDerecha)
            let alturaFila = (geo.size.height - margenExterior * 2 - espaciado) / 2

            ZStack {
                WoodTexture()
                    .ignoresSafeArea()

                HStack(spacing: espaciado) {
                    // Columna izquierda: reloj + día del mes.
                    VStack(spacing: espaciado) {
                        VentanaMarco {
                            AnalogClockView(hora: vm.horaActual)
                        }
                        .frame(width: anchoIzquierda, height: alturaFila)

                        VentanaMarco {
                            FlipGroupView(caracteres: vm.instantanea.diaMes, color: vm.instantanea.fase.color)
                        }
                        .frame(width: anchoIzquierda, height: alturaFila)
                    }

                    // Columna derecha: día de la semana + mes.
                    VStack(spacing: espaciado) {
                        VentanaMarco {
                            FlipGroupView(caracteres: vm.instantanea.diaSemana, color: vm.instantanea.fase.color)
                        }
                        .frame(width: anchoDerecha, height: alturaFila)

                        VentanaMarco {
                            FlipGroupView(caracteres: vm.instantanea.mes, color: vm.instantanea.fase.color)
                        }
                        .frame(width: anchoDerecha, height: alturaFila)
                    }
                }
                .padding(margenExterior)
            }
            .environment(\.calendarioViewModel, vm)
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        vm.arrastreEnCurso(traslacionVertical: value.translation.height)
                    }
                    .onEnded { _ in
                        vm.arrastreFinalizado()
                    }
            )
        }
        .statusBarHidden(true)
        .persistentSystemOverlays(.hidden)
        .onAppear { vm.iniciar() }
        .onDisappear { vm.detener() }
    }
}

#Preview {
    ContentView()
}
