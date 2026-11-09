import { useCallback, useState, useEffect } from "react";
import AvisoSinClaseElegida from "../components/AvisoSinClaseElegida";
import EncabezadoContextoCurso from "../components/EncabezadoContextoCurso";
import SelectorClaseTrabajo from "../components/SelectorClaseTrabajo";
import GestionTiposEvaluacion from "../components/planilla/GestionTiposEvaluacion";
import ModalSubnotasPlanilla from "../components/planilla/ModalSubnotasPlanilla";
import PorcentajesPlanilla from "../components/planilla/PorcentajesPlanilla";
import SelectorTipoEvaluacion from "../components/planilla/SelectorTipoEvaluacion";
import TablaNotasPlanilla from "../components/planilla/TablaNotasPlanilla";
import useClasePlanillaProfesor from "../hooks/planilla/useClasePlanillaProfesor";
import useComandosPlanillaProfesor from "../hooks/planilla/useComandosPlanillaProfesor";
import useComandosPorcentajesPlanilla from "../hooks/planilla/useComandosPorcentajesPlanilla";
import useComandosSubnotasPlanilla from "../hooks/planilla/useComandosSubnotasPlanilla";
import useConsultasPlanillaProfesor from "../hooks/planilla/useConsultasPlanillaProfesor";
import { tipoEvaluacionForzado } from "../utils/nivelAcademico";
import { formatearEtiquetaColumna } from "../utils/planilla/notas";

// La planilla de una clase y un período. La página la vuelve a montar (con
// `key`) al cambiar de clase o de período: así ninguna nota, subnota ni
// porcentaje de la clase anterior queda en pantalla.
function PlanillaDeLaClase({ asignacionId, periodo, tipoEvaluacion, onClaseNoDisponible, onCambiosPendientes }) {
    const {
        estudiantes,
        columnas,
        subnotasPorTipo,
        porcentajesPorTipo,
        porcentajesActivos,
        sumaPorcentajes,
        cargarPlanilla,
        setEstudiantes,
        setColumnas,
        setSubnotasPorTipo,
        setPorcentajesPorTipo,
    } =
        useConsultasPlanillaProfesor({
            asignacionId,
            periodo,
            onClaseNoDisponible,
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

    // Una nota que no se pudo guardar se pierde al cambiar de clase: la
    // página pregunta antes.
    const hayNotasSinGuardar = Object.keys(notasSinGuardar).length > 0;
    useEffect(() => {
        onCambiosPendientes(hayNotasSinGuardar);
    }, [hayNotasSinGuardar, onCambiosPendientes]);

    useEffect(() => () => onCambiosPendientes(false), [onCambiosPendientes]);

    return (
        <>
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
        </>
    );
}

function Planilla() {

    const [tipoEvaluacion, setTipoEvaluacion] = useState(
        localStorage.getItem("planillaTipoEvaluacion") || "numerica"
    );

    const profesorStorage = localStorage.getItem("profesor");
    const profesor = profesorStorage ? JSON.parse(profesorStorage) : null;
    const profesorId = profesor?.id;

    const {
        opciones,
        cargandoClases,
        errorClases,
        reintentarClases,
        asignacionEfectiva,
        claseSeleccionada,
        cambiarAsignacion,
        descartarAsignacion,
        periodo,
        cambiarPeriodo,
        informarCambiosPendientes,
        sinClase,
    } = useClasePlanillaProfesor(profesorId);

    useEffect(() => {
        if (!profesorId) window.location.href = "/login";
    }, [profesorId]);

    const manejarClaseNoDisponible = useCallback(() => descartarAsignacion(), [descartarAsignacion]);

    // Un curso sin nivel definido es el único caso libre: ningún nivel
    // definido (preescolar o primaria) deja elegir el tipo de evaluación.
    const evaluacionForzada = tipoEvaluacionForzado(claseSeleccionada?.nivel);

    // El nivel del curso manda sobre la preferencia guardada en localStorage:
    // preescolar siempre evalúa con desarrollo (caritas) y primaria siempre
    // con numérica, sin opción de cambiarlo. El servidor ya lo garantiza al
    // guardar; esto ajusta además lo que ve el profesor.
    useEffect(() => {
        if (evaluacionForzada && tipoEvaluacion !== evaluacionForzada) {
            setTipoEvaluacion(evaluacionForzada);
        }
    }, [evaluacionForzada, tipoEvaluacion]);

    // En tablet (de 600 px a xl) la planilla no suma su margen lateral al de
    // la página: ese ancho es para las notas. Los márgenes de arriba y abajo
    // van aparte para que `sm:` no le devuelva el margen lateral en tablet.
    return (
    <div className="px-3 py-3 sm:py-6 min-[600px]:px-0 xl:px-6">
        <EncabezadoContextoCurso
            titulo="Planilla de notas"
            etiqueta="Evaluación académica"
            descripcion="Registra y organiza las calificaciones de tus estudiantes."
            tituloContexto="¿Qué clase vas a calificar?"
            subtituloContexto="La clase y el período quedan elegidos también en Asistencia."
            controles={
                <SelectorClaseTrabajo
                    idPrefijo="planilla"
                    opciones={opciones}
                    asignacionId={asignacionEfectiva}
                    onCambiarAsignacion={cambiarAsignacion}
                    cargando={cargandoClases}
                    error={errorClases}
                    onReintentar={reintentarClases}
                    periodo={periodo}
                    onCambiarPeriodo={cambiarPeriodo}
                >
                    {!evaluacionForzada && !cargandoClases && (
                        <SelectorTipoEvaluacion
                            value={tipoEvaluacion}
                            onChange={(valor) => {
                                setTipoEvaluacion(valor);
                                localStorage.setItem("planillaTipoEvaluacion", valor);
                            }}
                        />
                    )}
                </SelectorClaseTrabajo>
            }
        />

        {asignacionEfectiva ? (
            <PlanillaDeLaClase
                key={`${asignacionEfectiva}|${periodo}`}
                asignacionId={asignacionEfectiva}
                periodo={periodo}
                tipoEvaluacion={tipoEvaluacion}
                onClaseNoDisponible={manejarClaseNoDisponible}
                onCambiosPendientes={informarCambiosPendientes}
            />
        ) : (
            <AvisoSinClaseElegida
                titulo={sinClase?.titulo}
                texto={sinClase?.texto}
                cargando={cargandoClases}
            />
        )}
    </div>
);
}

export default Planilla;
