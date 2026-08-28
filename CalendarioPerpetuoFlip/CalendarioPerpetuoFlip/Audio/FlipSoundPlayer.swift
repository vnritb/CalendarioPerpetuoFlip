//
//  FlipSoundPlayer.swift
//  CalendarioPerpetuoFlip
//
//  Genera y reproduce, por código y sin ningún archivo de audio, el
//  sonido característico de una lámina flip al girar: un "rrrrr"
//  de trinquete seguido de un golpe seco "clk!".
//

import AVFoundation

final class FlipSoundPlayer {

    static let shared = FlipSoundPlayer()

    private let engine = AVAudioEngine()
    private let jugador = AVAudioPlayerNode()
    private let sampleRate: Double = 44_100
    private let buffer: AVAudioPCMBuffer

    private init() {
        let formato = AVAudioFormat(standardFormatWithSampleRate: sampleRate, channels: 1)!
        buffer = FlipSoundPlayer.generarBufferFlip(sampleRate: sampleRate, formato: formato)

        configurarSesionDeAudio()

        engine.attach(jugador)
        engine.connect(jugador, to: engine.mainMixerNode, format: formato)
        engine.prepare()
        try? engine.start()
    }

    private func configurarSesionDeAudio() {
        #if os(iOS)
        let sesion = AVAudioSession.sharedInstance()
        try? sesion.setCategory(.ambient, options: [.mixWithOthers])
        try? sesion.setActive(true)
        #endif
    }

    /// Reproduce el sonido de flip; puede llamarse muchas veces seguidas
    /// (una por cada lámina que gira) sin que se corten entre sí.
    func reproducirFlip() {
        if !engine.isRunning {
            try? engine.start()
        }
        let nodoIndependiente = AVAudioPlayerNode()
        engine.attach(nodoIndependiente)
        engine.connect(nodoIndependiente, to: engine.mainMixerNode, format: buffer.format)
        nodoIndependiente.scheduleBuffer(buffer, at: nil, options: []) { [weak self] in
            DispatchQueue.main.async {
                self?.engine.disconnectNodeOutput(nodoIndependiente)
                self?.engine.detach(nodoIndependiente)
            }
        }
        nodoIndependiente.play()
    }

    // MARK: - Síntesis del sonido

    private static func generarBufferFlip(sampleRate: Double, formato: AVAudioFormat) -> AVAudioPCMBuffer {
        let duracionTrinquete = 0.15
        let duracionGolpe = 0.06
        let duracionTotal = duracionTrinquete + duracionGolpe + 0.03
        let numFrames = AVAudioFrameCount(sampleRate * duracionTotal)

        let buf = AVAudioPCMBuffer(pcmFormat: formato, frameCapacity: numFrames)!
        buf.frameLength = numFrames
        let datos = buf.floatChannelData![0]

        var semilla: UInt64 = 0x2545F4914F6CDD1D
        func ruidoBlanco() -> Double {
            semilla = semilla &* 6_364_136_223_846_793_005 &+ 1_442_695_040_888_963_407
            let valor = Double((semilla >> 33) & 0xFFFF) / Double(0xFFFF)
            return valor * 2 - 1
        }

        let framesTrinquete = Int(sampleRate * duracionTrinquete)
        for i in 0..<framesTrinquete {
            let t = Double(i) / sampleRate
            let ruido = ruidoBlanco()
            // Modulación en "dientes" para simular el trinquete mecánico (rrrrr).
            let modulacion = 0.35 + 0.65 * abs(sin(2 * .pi * 42 * t))
            let envolvente = 1.0 - (t / duracionTrinquete) * 0.55
            datos[i] = Float(ruido * modulacion * envolvente * 0.45)
        }

        let inicioGolpe = framesTrinquete
        let framesGolpe = Int(sampleRate * duracionGolpe)
        for i in 0..<framesGolpe {
            let t = Double(i) / sampleRate
            let ruido = ruidoBlanco()
            let tono = sin(2 * .pi * 180 * t)
            let envolvente = exp(-t * 55)
            datos[inicioGolpe + i] = Float((ruido * 0.6 + tono * 0.4) * envolvente * 0.9)
        }

        let inicioSilencio = inicioGolpe + framesGolpe
        for i in inicioSilencio..<Int(numFrames) {
            datos[i] = 0
        }

        return buf
    }
}
