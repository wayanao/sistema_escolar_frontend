import { useMemo } from "react";
import Swal from "sweetalert2";
import EncabezadoAdmisionesView, {
  SinAnioEnPreparacionView,
} from "../components/admisiones/EncabezadoAdmisionesView";
import FichaAdmisionView from "../components/admisiones/FichaAdmisionView";
import ListaAdmisionesView from "../components/admisiones/ListaAdmisionesView";
import NuevoAspiranteView from "../components/admisiones/NuevoAspiranteView";
import SpinnerView from "../components/anioLectivo/SpinnerView";
import useComandosAdmision from "../hooks/admisiones/useComandosAdmision";
import useConsultasAdmisiones from "../hooks/admisiones/useConsultasAdmisiones";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import { ESTADO_PREPARACION } from "../utils/anioLectivo";

// Raíz de composición de Admisiones (entrevista de admisión, paso E4). Ver
// docs/funcionalidades/ENTREVISTA_ADMISION.md.
//
// Trabaja siempre con el año en preparación, no con el que esté elegido en el
// selector: las admisiones viven en la preparación del año (decisión 1). Solo
// cablea los dos hooks con las vistas; confirmar antes de borrar es lo único
// que decide aquí, porque es trabajo de la pantalla.
function AdmisionesAdmin() {
  const { anios, cargando: cargandoAnios } = useAnioLectivo();
  const anioPreparacion = useMemo(
    () => anios.find((anio) => anio.estado === ESTADO_PREPARACION) ?? null,
    [anios],
  );
  const anioLectivoId = anioPreparacion?.id ?? null;
  const consultas = useConsultasAdmisiones(anioLectivoId, { cargarCursos: true });
  const comandos = useComandosAdmision({ anioLectivoId, recargar: consultas.recargar });

  if (!anioPreparacion) return <SinAnioEnPreparacionView cargando={cargandoAnios} />;

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
        onCancelar={comandos.cerrar}
      />
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
        onCerrar={comandos.cerrar}
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
          onNuevo={comandos.abrirNuevo}
          onAbrir={(admisionId) => void comandos.abrirFicha(admisionId)}
        />
      </div>
    </div>
  );
}

export default AdmisionesAdmin;
