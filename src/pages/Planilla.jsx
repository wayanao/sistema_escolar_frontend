import { useCallback, useState, useEffect, useRef } from "react";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import GestionTiposEvaluacion from "../components/planilla/GestionTiposEvaluacion";
import ModalSubnotasPlanilla from "../components/planilla/ModalSubnotasPlanilla";
import PorcentajesPlanilla from "../components/planilla/PorcentajesPlanilla";
import SelectorTipoEvaluacion from "../components/planilla/SelectorTipoEvaluacion";
import TablaNotasPlanilla from "../components/planilla/TablaNotasPlanilla";
import useComandosPlanillaProfesor from "../hooks/planilla/useComandosPlanillaProfesor";
import useComandosPorcentajesPlanilla from "../hooks/planilla/useComandosPorcentajesPlanilla";
import useComandosSubnotasPlanilla from "../hooks/planilla/useComandosSubnotasPlanilla";
import useConsultasPlanillaProfesor from "../hooks/planilla/useConsultasPlanillaProfesor";
import { tipoEvaluacionForzado } from "../utils/nivelAcademico";
import { obtenerPeriodoProfesor } from "../utils/periodoProfesor";
import { formatearEtiquetaColumna } from "../utils/planilla/notas";

function Planilla() {

    const avisoSeleccionRef = useRef(false);
    const [asignacionId] = useState(
        localStorage.getItem("asignacionId") || ""
    );
    const [periodo] = useState(() => obtenerPeriodoProfesor());
    const [fecha] = useState(
    localStorage.getItem("fechaAsistencia") || ""
    );
    const [tipoEvaluacion, setTipoEvaluacion] = useState(
        localStorage.getItem("planillaTipoEvaluacion") || "numerica"
    );

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const profesorId = profesor?.id;

    const pedirSeleccionClase = useCallback(() => {
        if (avisoSeleccionRef.current) return;

        avisoSeleccionRef.current = true;
        alert("Selecciona una asignación primero en la página principal");
        window.location.href = "/";
    }, []);

    const manejarClaseNoDisponible = useCallback(() => {
        localStorage.removeItem("asignacionId");
        alert("La clase seleccionada ya no está disponible. Selecciónala nuevamente.");
        window.location.href = "/";
    }, []);

    const {
        estudiantes,
        columnas,
        subnotasPorTipo,
        porcentajesPorTipo,
        porcentajesActivos,
        sumaPorcentajes,
        clases,
        cargarPlanilla,
        setEstudiantes,
        setColumnas,
        setSubnotasPorTipo,
        setPorcentajesPorTipo,
    } =
        useConsultasPlanillaProfesor({
            profesorId,
            asignacionId,
            periodo,
            onClaseNoDisponible: manejarClaseNoDisponible,
        });

    const {
        nuevoTipo,
        setNuevoTipo,
        nuevoPorcentaje,
        setNuevoPorcentaje,
        tipoEliminar,
        setTipoEliminar,
        accionTipoEnCurso,
        notasSinGuardar,
        guardarNota,
        agregarTipoEvaluacion,
        eliminarTipoEvaluacion,
    } = useComandosPlanillaProfesor({
        asignacionId,
        periodo,
        tipoEvaluacion,
        estudiantes,
        columnas,
        subnotasPorTipo,
        porcentajesPorTipo,
        setEstudiantes,
        setColumnas,
        cargarPlanilla,
    });

    // Porcentajes por tipo de nota (parte B de docs/funcionalidades/SUBNOTAS_PLANILLA.md).
    const porcentajes = useComandosPorcentajesPlanilla({
        asignacionId,
        periodo,
        columnas,
        porcentajesPorTipo,
        setPorcentajesPorTipo,
    });

    // Subnotas (docs/funcionalidades/SUBNOTAS_PLANILLA.md): el modal de un
    // estudiante en un tipo de nota.
    const subnotas = useComandosSubnotasPlanilla({
        asignacionId,
        periodo,
        tipoEvaluacion,
        estudiantes,
        columnas,
        subnotasPorTipo,
        setEstudiantes,
        setSubnotasPorTipo,
    });

    useEffect(() => {
        if (!profesorId) {
        window.location.href = "/login";
        return;
        }

        if (!asignacionId || !periodo) {
        pedirSeleccionClase();
        }

    }, [asignacionId, periodo, profesorId, pedirSeleccionClase]);

    const selectedClase = clases.find(c => c.id == asignacionId);
    // Un curso sin nivel definido es el único caso libre: ningún nivel
    // definido (preescolar o primaria) deja elegir el tipo de evaluación.
    const evaluacionForzada = tipoEvaluacionForzado(selectedClase?.nivel);

    // El nivel del curso manda sobre la preferencia guardada en localStorage:
    // preescolar siempre evalúa con desarrollo (caritas) y primaria siempre
    // con numérica, sin opción de cambiarlo. El servidor ya lo garantiza al
    // guardar; esto ajusta además lo que ve el profesor.
    useEffect(() => {
        if (evaluacionForzada && tipoEvaluacion !== evaluacionForzada) {
            setTipoEvaluacion(evaluacionForzada);
        }
    }, [evaluacionForzada, tipoEvaluacion]);

    // En tablet (de md a xl) la planilla no suma su margen lateral al de la
    // página: con el riel del menú, ese ancho es para las notas.
    return (
    <div className="p-3 sm:p-6 md:px-0 xl:px-6">
        <EncabezadoContextoCurso
            titulo="Planilla de notas"
            etiqueta="Evaluación académica"
            descripcion="Registra y organiza las calificaciones de tus estudiantes."
            materia={selectedClase?.materia}
            curso={selectedClase?.curso}
            periodo={periodo}
            fecha={fecha}
        >
                {!evaluacionForzada && (
                    <SelectorTipoEvaluacion
                        value={tipoEvaluacion}
                        onChange={(valor) => {
                            setTipoEvaluacion(valor);
                            localStorage.setItem("planillaTipoEvaluacion", valor);
                        }}
                    />
                )}
        </EncabezadoContextoCurso>

        <GestionTiposEvaluacion
            nuevoTipo={nuevoTipo}
            onCambiarNuevoTipo={setNuevoTipo}
            nuevoPorcentaje={nuevoPorcentaje}
            onCambiarNuevoPorcentaje={setNuevoPorcentaje}
            onAgregarTipo={agregarTipoEvaluacion}
            tipoEliminar={tipoEliminar}
            onCambiarTipoEliminar={setTipoEliminar}
            onEliminarTipo={eliminarTipoEvaluacion}
            columnas={columnas}
            accionTipoEnCurso={accionTipoEnCurso}
            formatearEtiquetaColumna={formatearEtiquetaColumna}
        />

        <PorcentajesPlanilla
            columnas={columnas}
            porcentajesPorTipo={porcentajesPorTipo}
            suma={sumaPorcentajes}
            activos={porcentajesActivos}
            tipoGuardando={porcentajes.tipoGuardando}
            formatearEtiquetaColumna={formatearEtiquetaColumna}
            onGuardar={porcentajes.guardarPorcentaje}
        />

        <TablaNotasPlanilla
            estudiantes={estudiantes}
            columnas={columnas}
            guardarNota={guardarNota}
            tipoEvaluacion={tipoEvaluacion}
            formatearEtiquetaColumna={formatearEtiquetaColumna}
            notasSinGuardar={notasSinGuardar}
            subnotasPorTipo={subnotasPorTipo}
            onAbrirSubnotas={subnotas.abrir}
            porcentajesPorTipo={porcentajesPorTipo}
        />

        {subnotas.abierta && (
            <ModalSubnotasPlanilla
                estudiante={subnotas.estudiante}
                tipo={subnotas.tipo}
                tipoEvaluacion={tipoEvaluacion}
                subnotas={subnotas.subnotas}
                borrador={subnotas.borrador}
                invalidas={subnotas.invalidas}
                vistaPrevia={subnotas.vistaPrevia}
                hayCambios={subnotas.hayCambios}
                notaAMano={subnotas.notaAMano}
                quedaraVacia={subnotas.quedaraVacia}
                limiteAlcanzado={subnotas.limiteAlcanzado}
                posicion={subnotas.posicion}
                total={subnotas.total}
                hayAnterior={subnotas.hayAnterior}
                haySiguiente={subnotas.haySiguiente}
                accionEnCurso={subnotas.accionEnCurso}
                formatearEtiquetaColumna={formatearEtiquetaColumna}
                onCambiarCalificacion={subnotas.cambiarCalificacion}
                onGuardar={subnotas.guardar}
                onSiguiente={subnotas.irAlSiguiente}
                onAnterior={subnotas.irAlAnterior}
                onCerrar={subnotas.cerrar}
                onCrearSubnota={subnotas.crearSubnota}
                onRenombrarSubnota={subnotas.cambiarNombreSubnota}
                onBorrarSubnota={subnotas.borrarSubnota}
            />
        )}
    </div>
);
}

export default Planilla;
