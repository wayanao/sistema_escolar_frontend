import { useMemo, useState } from "react";
import Swal from "sweetalert2";
import EncabezadoAdmisionesView, {
  SinAnioEnPreparacionView,
} from "../components/admisiones/EncabezadoAdmisionesView";
import FichaAdmisionView from "../components/admisiones/FichaAdmisionView";
import ListaAdmisionesView from "../components/admisiones/ListaAdmisionesView";
import MatricularAdmisionView from "../components/admisiones/MatricularAdmisionView";
import NuevoAspiranteView from "../components/admisiones/NuevoAspiranteView";
import SpinnerView from "../components/anioLectivo/SpinnerView";
import FormularioEstudianteAdmin from "../components/estudiantesObservador/admin/FormularioEstudianteAdmin";
import useComandosAdmision from "../hooks/admisiones/useComandosAdmision";
import useConsultasAdmisiones from "../hooks/admisiones/useConsultasAdmisiones";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useFormularioEstudianteAdmin from "../hooks/estudiantesObservador/useFormularioEstudianteAdmin";
import { datosParaMatricular } from "../utils/admisiones/formularios";
import { ESTADO_PREPARACION } from "../utils/anioLectivo";

// Raíz de composición de Admisiones (entrevista de admisión, pasos E4 y E5).
// Ver docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// Trabaja siempre con el año en preparación, no con el que esté elegido en el
// selector: las admisiones viven en la preparación del año (decisión 1).
// Cablea los hooks con las vistas. Matricular (E5) usa la ficha y el hook de
// Estudiantes, como "Editar datos" en Años lectivos: al guardar, en vez de
// crear un estudiante, matricula desde la admisión. Confirmar antes de borrar
// y los avisos de la ficha son trabajo de la pantalla.
function AdmisionesAdmin() {
  const { anios, cargando: cargandoAnios } = useAnioLectivo();
  const anioPreparacion = useMemo(
    () => anios.find((anio) => anio.estado === ESTADO_PREPARACION) ?? null,
    [anios],
  );
  const anioLectivoId = anioPreparacion?.id ?? null;
  const consultas = useConsultasAdmisiones(anioLectivoId, { cargarCursos: true });
  const comandos = useComandosAdmision({ anioLectivoId, recargar: consultas.recargar });
  const fichaEstudiante = useFormularioEstudianteAdmin({
    crearEstudianteFn: comandos.matricularConFicha,
  });
  const [abriendoMatricula, setAbriendoMatricula] = useState(false);

  if (!anioPreparacion) return <SinAnioEnPreparacionView cargando={cargandoAnios} />;

  // Cambiar de aspirante cierra la ficha del estudiante que estuviera abierta.
  const abrirFicha = (admisionId) => {
    fichaEstudiante.cancelarFormulario();
    void comandos.abrirFicha(admisionId);
  };
  const abrirNuevo = () => {
    fichaEstudiante.cancelarFormulario();
    comandos.abrirNuevo();
  };
  const cerrar = () => {
    fichaEstudiante.cancelarFormulario();
    comandos.cerrar();
  };

  const abrirMatricula = async () => {
    const { admision } = comandos;
    setAbriendoMatricula(true);
    const respuesta = await fichaEstudiante.abrirConDatos(datosParaMatricular(admision), {
      desdeEstudianteId: admision.aviso_documento?.estudiante_id ?? null,
    });
    setAbriendoMatricula(false);
    if (respuesta.estado === "error") {
      comandos.avisarError(
        "No se pudo leer la ficha del estudiante que ya existe. Intenta de nuevo.",
      );
    }
  };

  const guardarMatricula = async (evento) => {
    evento.preventDefault();
    const respuesta = await fichaEstudiante.guardarEstudiante();
    // Si el backend lo rechaza, `matricularConFicha` ya dejó su mensaje.
    if (respuesta.estado === "validacion") {
      comandos.avisarError(
        "Completa los campos obligatorios de la ficha: nombre, apellidos y curso.",
      );
    }
  };

  const registrar = (evento) => {
    evento.preventDefault();
    void comandos.registrar();
  };

  const guardarFicha = (evento) => {
    evento.preventDefault();
    void comandos.guardarFicha();
  };

  const borrar = async () => {
    const { nombre, apellido } = comandos.admision;
    const confirmacion = await Swal.fire({
      icon: "warning",
      title: `¿Borrar la admisión de ${nombre} ${apellido}?`,
      text: "Se borran sus datos y su entrevista. No se puede deshacer.",
      showCancelButton: true,
      confirmButtonText: "Borrar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
    });
    if (confirmacion.isConfirmed) await comandos.borrar();
  };

  let panel = null;
  if (comandos.modo === "nuevo") {
    panel = (
      <NuevoAspiranteView
        anio={anioPreparacion.anio}
        formulario={comandos.formulario}
        errores={comandos.errores}
        cursos={consultas.cursos}
        guardando={comandos.guardando}
        onCambiar={comandos.cambiarCampo}
        onRegistrar={registrar}
        onCancelar={cerrar}
      />
    );
  } else if (comandos.modo === "ficha" && comandos.admision && fichaEstudiante.showForm) {
    const { admision } = comandos;
    panel = (
      <MatricularAdmisionView
        nombre={`${admision.nombre} ${admision.apellido}`}
        anio={anioPreparacion.anio}
        esExalumno={Boolean(admision.aviso_documento)}
      >
        <FormularioEstudianteAdmin
          visible
          editingId={null}
          estudianteData={fichaEstudiante.estudianteData}
          setEstudianteData={fichaEstudiante.setEstudianteData}
          cursos={consultas.cursos}
          onSubmit={guardarMatricula}
          onCancelar={fichaEstudiante.cancelarFormulario}
          guardando={fichaEstudiante.guardando}
          titulo="Ficha del estudiante"
          textoBoton={`Matricular en ${anioPreparacion.anio}`}
        />
      </MatricularAdmisionView>
    );
  } else if (comandos.modo === "ficha") {
    panel = comandos.admision ? (
      <FichaAdmisionView
        admision={comandos.admision}
        formulario={comandos.formulario}
        errores={comandos.errores}
        cursos={consultas.cursos}
        resultado={comandos.resultado}
        erroresResultado={comandos.erroresResultado}
        guardando={comandos.guardando}
        guardandoResultado={comandos.guardandoResultado}
        borrando={comandos.borrando}
        onCambiar={comandos.cambiarCampo}
        onGuardar={guardarFicha}
        onCambiarResultado={comandos.cambiarResultado}
        onGuardarResultado={() => void comandos.guardarResultado()}
        onBorrar={() => void borrar()}
        onCerrar={cerrar}
        onMatricular={() => void abrirMatricula()}
        abriendoMatricula={abriendoMatricula}
      />
    ) : (
      <p className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
        <SpinnerView />
        Abriendo la admisión...
      </p>
    );
  }

  return (
    <div className="w-full space-y-4 py-2 sm:space-y-6">
      <EncabezadoAdmisionesView
        anio={anioPreparacion.anio}
        mensaje={comandos.mensaje}
        error={comandos.error || consultas.error}
      />
      {/* En móvil, lo abierto va primero; en pantalla ancha, a la derecha. */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        {panel && <div className="min-w-0 lg:order-last">{panel}</div>}
        <ListaAdmisionesView
          anio={anioPreparacion.anio}
          editable={consultas.editable}
          conteos={consultas.conteos}
          filtro={consultas.filtro}
          onCambiarFiltro={consultas.setFiltro}
          admisiones={consultas.visibles}
          cargando={consultas.cargando}
          seleccionadaId={comandos.admision?.id ?? null}
          onNuevo={abrirNuevo}
          onAbrir={abrirFicha}
        />
      </div>
    </div>
  );
}

export default AdmisionesAdmin;
