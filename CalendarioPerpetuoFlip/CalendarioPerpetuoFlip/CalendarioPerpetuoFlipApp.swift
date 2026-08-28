//
//  CalendarioPerpetuoFlipApp.swift
//  CalendarioPerpetuoFlip
//
//  Punto de entrada de la app. Fuerza orientación apaisada y oculta
//  la interfaz del sistema para que el calendario ocupe toda la
//  pantalla del iPad, como un calendario de sobremesa real.
//

import SwiftUI

@main
struct CalendarioPerpetuoFlipApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
    }
}
