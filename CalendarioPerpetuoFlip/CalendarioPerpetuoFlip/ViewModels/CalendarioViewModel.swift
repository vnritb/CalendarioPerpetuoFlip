//
//  CalendarioViewModel.swift
//  CalendarioPerpetuoFlip
//
//  Cerebro de la app: mantiene la fecha real y la hora del reloj analógico,
//  y programa la actualización automática a medianoche.
//

import SwiftUI
import Observation

@Observable
final class CalendarioViewModel {

    // MARK: - Estado publicado

    /// Instantánea que deben pintar los tres cuadrantes flip.
    private(set) var instantanea: InstantaneaFlip

    /// Hora actual para el reloj analógico (se actualiza cada segundo,
    /// totalmente independiente del resto del estado).
    private(set) var horaActual: Date = Date()

    // MARK: - Estado interno

    /// Fecha real de "hoy".
    private var fechaReal: Date = Date()

    /// Desplazamiento en días confirmado tras soltar el dedo (0 = mostrando fecha real).
    private var desplazamientoConfirmado: Int = 0

    /// Desplazamiento en días mientras el dedo sigue en pantalla (vista previa en vivo).
    private var desplazamientoEnCurso: Int = 0

    private var arrastrando = false

    /// Número de caracteres que están actualmente animando.
    /// Mientras sea > 0, se bloquean los cambios de instantánea.
    private var animacionesActivas: Int = 0

    /// Instantánea pendiente de aplicar una vez terminen todas las animaciones.
    private var instantaneaPendiente: InstantaneaFlip?

    // MARK: - Temporizadores

    private var timerReloj: Timer?
    private var timerMedianoche: Timer?
    private var timerVerificacionHoraria: Timer?
    private var timerRevertir: Timer?

    /// Píxeles de arrastre necesarios para avanzar/retroceder un día.
    private let puntosPorDia: CGFloat = 60

    /// Segundos que se mantiene visible en rojo la fecha alcanzada tras soltar el dedo.
    private let segundosVistaPrevia: TimeInterval = 6

    init() {
        instantanea = InstantaneaFlip.desde(fecha: Date(), fase: .normal)
        configurarNotificacionesDeApp()
    }

    // MARK: - Notificaciones de cambio de estado de la app

    private func configurarNotificacionesDeApp() {
        #if os(iOS)
        // Cuando la app vuelve del segundo plano, verificar la fecha
        NotificationCenter.default.addObserver(
            forName: UIApplication.willEnterForegroundNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            print("📱 App volviendo del segundo plano - verificando fecha...")
            self.verificarYCorregirFecha()
            self.fechaReal = Date()
            self.actualizarInstantanea(fase: .normal)
            // Reprogramar medianoche por si cambió la fecha
            self.programarMedianoche()
        }
        
        // Cuando la app se vuelve activa, también verificar
        NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self = self else { return }
            self.verificarYCorregirFecha()
        }
        #endif
    }

    // MARK: - Ciclo de vida

    func iniciar() {
        actualizarInstantanea(fase: .normal)
        iniciarRelojDeSegundos()
        programarMedianoche()
        programarVerificacionHoraria()
    }

    func detener() {
        timerReloj?.invalidate()
        timerMedianoche?.invalidate()
        timerVerificacionHoraria?.invalidate()
        timerRevertir?.invalidate()
    }

    // MARK: - Reloj analógico (independiente del flip)

    private func iniciarRelojDeSegundos() {
        timerReloj?.invalidate()
        timerReloj = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.horaActual = Date()
        }
        if let timerReloj { RunLoop.main.add(timerReloj, forMode: .common) }
    }

    // MARK: - Actualización automática a medianoche

    private func programarMedianoche() {
        timerMedianoche?.invalidate()
        let proxima = CalendarioDatos.proximaMedianoche(desde: Date())
        let intervalo = max(1, proxima.timeIntervalSinceNow)
        timerMedianoche = Timer.scheduledTimer(withTimeInterval: intervalo, repeats: false) { [weak self] _ in
            guard let self else { return }
            self.fechaReal = Date()
            self.actualizarInstantanea(fase: .normal)
            self.programarMedianoche()
        }
        if let timerMedianoche { RunLoop.main.add(timerMedianoche, forMode: .common) }
    }

    // MARK: - Verificación horaria de integridad

    /// Programa una verificación automática cada hora para asegurar que la fecha
    /// mostrada sea correcta. Si detecta alguna discrepancia (día de la semana,
    /// día del mes o mes incorrecto), corrige inmediatamente la instantánea.
    private func programarVerificacionHoraria() {
        timerVerificacionHoraria?.invalidate()
        
        // Programar para ejecutarse cada hora (3600 segundos)
        timerVerificacionHoraria = Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { [weak self] _ in
            guard let self else { return }
            // Solo verificar si no hay un swipe activo
            if !self.arrastrando && self.desplazamientoConfirmado == 0 {
                self.verificarYCorregirFecha()
            }
        }
        if let timerVerificacionHoraria { 
            RunLoop.main.add(timerVerificacionHoraria, forMode: .common) 
        }
        
        // También ejecutar una verificación inmediata al iniciar
        verificarYCorregirFecha()
    }

    /// Verifica que toda la información mostrada (día de la semana, día del mes
    /// y mes) coincida exactamente con la fecha actual del sistema. Si detecta
    /// cualquier discrepancia, corrige la instantánea completa.
    private func verificarYCorregirFecha() {
        let fechaActual = Date()
        
        // Obtener los componentes que deberían mostrarse
        let comp = CalendarioDatos.componentes(de: fechaActual)
        let diaSemanaEsperado = CalendarioDatos.caracteres(comp.diaSemanaAbrev)
        let diaMesEsperado = CalendarioDatos.digitosDia(comp.diaMes)
        let mesEsperado = CalendarioDatos.caracteres(comp.mesAbrev)
        
        // Verificar cada componente individualmente
        let diaSemanaIncorrecto = instantanea.diaSemana != diaSemanaEsperado
        let diaMesIncorrecto = instantanea.diaMes != diaMesEsperado
        let mesIncorrecto = instantanea.mes != mesEsperado
        
        let necesitaCorreccion = diaSemanaIncorrecto || diaMesIncorrecto || mesIncorrecto
        
        if necesitaCorreccion {
            // Actualizar fechaReal por si estaba desincronizada
            fechaReal = fechaActual
            
            // Crear una instantánea completamente nueva con todos los valores correctos
            instantanea = InstantaneaFlip(
                diaSemana: diaSemanaEsperado,
                diaMes: diaMesEsperado,
                mes: mesEsperado,
                fase: .normal
            )
            
            // Log de diagnóstico
            var errores: [String] = []
            if diaSemanaIncorrecto {
                errores.append("Día semana corregido → \(comp.diaSemanaAbrev)")
            }
            if diaMesIncorrecto {
                errores.append("Día mes corregido → \(comp.diaMes)")
            }
            if mesIncorrecto {
                errores.append("Mes corregido → \(comp.mesAbrev)")
            }
            print("🔄 Verificación horaria: \(comp.diaSemanaAbrev) \(comp.diaMes) \(comp.mesAbrev)")
            print("   Correcciones: \(errores.joined(separator: ", "))")
        } else {
            print("✅ Verificación horaria: fecha correcta (\(comp.diaSemanaAbrev) \(comp.diaMes) \(comp.mesAbrev))")
        }
    }

    // MARK: - Gesto de swipe (navegación temporal)

    /// Llamado continuamente mientras el dedo se mueve verticalmente.
    /// Swipe hacia arriba = retroceder en el tiempo (días negativos)
    /// Swipe hacia abajo = adelantar en el tiempo (días positivos)
    func arrastreEnCurso(traslacionVertical: CGFloat) {
        // BLOQUEO: No permitir swipes mientras haya animaciones en curso
        guard animacionesActivas == 0 else {
            print("🚫 Swipe bloqueado: \(animacionesActivas) animaciones en curso")
            return
        }
        
        arrastrando = true
        
        // Cancelar el timer de reversión si existe
        timerRevertir?.invalidate()
        
        // Calcular días: positivo hacia abajo (futuro), negativo hacia arriba (pasado)
        let dias = Int((traslacionVertical / puntosPorDia).rounded())
        
        // Solo actualizar si el desplazamiento realmente cambió
        guard dias != desplazamientoEnCurso else { return }
        
        desplazamientoEnCurso = dias
        actualizarInstantanea(fase: .arrastrando) // Amarillo (no se valida durante arrastre)
    }

    /// Llamado cuando el usuario levanta el dedo. La fecha alcanzada se
    /// suma a lo ya confirmado en swipes anteriores, se pone en rojo,
    /// y tras 6 segundos vuelve a la fecha actual en blanco.
    func arrastreFinalizado() {
        // Si hay animaciones activas, ignorar el gesto completamente
        guard animacionesActivas == 0 else {
            print("🚫 Fin de swipe bloqueado: \(animacionesActivas) animaciones en curso")
            arrastrando = false
            desplazamientoEnCurso = 0
            return
        }
        
        arrastrando = false
        desplazamientoConfirmado += desplazamientoEnCurso
        desplazamientoEnCurso = 0

        // Actualizar a fase alerta (rojo) y validar
        actualizarInstantanea(fase: .alerta)
        validarYCorregirSiNecesario(fase: .alerta)

        // Programar reversión a fecha actual tras 6 segundos
        timerRevertir?.invalidate()
        timerRevertir = Timer.scheduledTimer(withTimeInterval: segundosVistaPrevia, repeats: false) { [weak self] _ in
            guard let self else { return }
            self.desplazamientoConfirmado = 0
            self.actualizarInstantanea(fase: .normal) // Volver a blanco con fecha actual
            self.validarYCorregirSiNecesario(fase: .normal)
        }
        if let timerRevertir { RunLoop.main.add(timerRevertir, forMode: .common) }
    }

    // MARK: - Cálculo de instantánea

    /// Actualiza la instantánea con la fecha correspondiente y la fase de color indicada.
    private func actualizarInstantanea(fase: FaseColorFlip) {
        let desplazamientoTotal = desplazamientoConfirmado + desplazamientoEnCurso
        let fechaMostrada = CalendarioDatos.sumarDias(desplazamientoTotal, a: fechaReal)
        let nueva = InstantaneaFlip.desde(fecha: fechaMostrada, fase: fase)
        
        // Para fases no-arrastrando, validar la nueva instantánea antes de aplicarla
        if fase != .arrastrando {
            let esValida = CalendarioDatos.sonComponentesValidos(
                diaSemana: nueva.diaSemana,
                diaMes: nueva.diaMes,
                mes: nueva.mes
            )
            
            if !esValida {
                print("⚠️ ADVERTENCIA: InstantaneaFlip.desde() generó datos inválidos para \(fechaMostrada)")
                print("   Regenerando con cálculo directo...")
                
                // Si la instantánea generada es inválida, forzar recálculo
                let comp = CalendarioDatos.componentes(de: fechaMostrada)
                let nuevaCorregida = InstantaneaFlip(
                    diaSemana: CalendarioDatos.caracteres(comp.diaSemanaAbrev),
                    diaMes: CalendarioDatos.digitosDia(comp.diaMes),
                    mes: CalendarioDatos.caracteres(comp.mesAbrev),
                    fase: fase
                )
                
                guard nuevaCorregida != instantanea else { return }
                instantanea = nuevaCorregida
                return
            }
        }
        
        guard nueva != instantanea else { return }
        instantanea = nueva
    }

    // MARK: - Control de animaciones (bloqueo transaccional)

    /// Notifica que un carácter ha iniciado su animación de flip.
    func notificarInicioAnimacion() {
        animacionesActivas += 1
        print("🎬 Animación iniciada. Total activas: \(animacionesActivas)")
    }

    /// Notifica que un carácter ha finalizado su animación de flip.
    func notificarFinAnimacion() {
        animacionesActivas = max(0, animacionesActivas - 1)
        print("🎬 Animación finalizada. Total activas: \(animacionesActivas)")
        
        // Si todas las animaciones terminaron y hay una instantánea pendiente, aplicarla
        if animacionesActivas == 0, let pendiente = instantaneaPendiente {
            print("✅ Todas las animaciones finalizaron. Aplicando instantánea pendiente.")
            instantaneaPendiente = nil
            instantanea = pendiente
        }
    }

    /// Valida que la instantánea actual sea coherente (excepto durante el arrastre).
    /// Si no lo es, recalcula desde la fecha real.
    /// Solo se aplica en las fases `.alerta` (rojo) y `.normal` (blanco).
    private func validarYCorregirSiNecesario(fase: FaseColorFlip) {
        // Durante el arrastre (amarillo) no validamos para permitir libertad visual
        guard fase != .arrastrando else { return }

        print("🔍 Validando instantánea en fase \(fase):")
        print("   DiaSemana: \(instantanea.diaSemana.joined())")
        print("   DiaMes: \(instantanea.diaMes.joined())")
        print("   Mes: \(instantanea.mes.joined())")

        let esValida = CalendarioDatos.sonComponentesValidos(
            diaSemana: instantanea.diaSemana,
            diaMes: instantanea.diaMes,
            mes: instantanea.mes
        )

        if !esValida {
            print("⚠️ Instantánea inválida detectada en fase \(fase). Corrigiendo...")
            
            // Recalcular desde la fecha que debería mostrarse
            let desplazamientoTotal = desplazamientoConfirmado + desplazamientoEnCurso
            let fechaMostrada = CalendarioDatos.sumarDias(desplazamientoTotal, a: fechaReal)
            
            print("   Fecha base: \(fechaReal)")
            print("   Desplazamiento: \(desplazamientoTotal) días")
            print("   Fecha calculada: \(fechaMostrada)")
            
            let nuevaInstantanea = InstantaneaFlip.desde(fecha: fechaMostrada, fase: fase)
            instantanea = nuevaInstantanea
            
            print("✅ Instantánea corregida: \(instantanea.diaSemana.joined()) \(instantanea.diaMes.joined()) \(instantanea.mes.joined())")
        } else {
            print("✅ Instantánea válida")
        }
    }
    
    deinit {
        // Limpiar observadores de notificaciones
        NotificationCenter.default.removeObserver(self)
    }
}
