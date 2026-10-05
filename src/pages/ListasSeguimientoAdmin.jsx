import Swal from "sweetalert2";
import VistaListasSeguimiento from "../components/listasSeguimiento/VistaListasSeguimiento";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useComandosListasSeguimiento from "../hooks/listasSeguimiento/useComandosListasSeguimiento";
import useConsultasListasSeguimiento from "../hooks/listasSeguimiento/useConsultasListasSeguimiento";

// Raíz de composición. Ver docs/funcionalidades/LISTAS_SEGUIMIENTO.md.
//
// Solo cablea: llama a los dos hooks y le pasa sus piezas a la vista. Sin HTTP
// directo, sin transformaciones grandes y sin bloques visuales propios.
function ListasSeguimientoAdmin() {
  // El año que mira el admin: sus cursos y, en un año cerrado, solo consulta.
  const { parametros, permisos } = useAnioLectivo();
  const consultas = useConsultasListasSeguimiento({ parametrosAnio: parametros });
  const comandos = useComandosListasSeguimiento({
    cursoId: consultas.cursoId,
    lista: consultas.lista,
    setLista: consultas.setLista,
    recargar: consultas.recargar,
    parametrosAnio: parametros,
  });

  // El único trozo de lógica que vive aquí, y es porque es lo único que
  // necesita a los dos hooks a la vez: avisar antes de cambiar de curso si hay
  // marcas sin guardar.
  //
  // El hook de comando descarta lo pendiente al cambiar de curso, a propósito
  // -aplicarlo a otro curso sería peor que perderlo-, pero descartar en
  // silencio sí sería una trampa. Preguntar es trabajo de la pantalla.
  const seleccionarCurso = async (valor) => {
    if (comandos.hayCambios) {
      const confirmacion = await Swal.fire({
        icon: "warning",
        title: "Tienes cambios sin guardar",
        text: "Si cambias de curso, se perderán. ¿Quieres cambiar de todas formas?",
        showCancelButton: true,
        confirmButtonText: "Cambiar de curso",
        cancelButtonText: "Quedarme aquí",
        confirmButtonColor: "#dc2626",
      });
      if (!confirmacion.isConfirmed) return;
    }

    consultas.seleccionarCurso(valor);
  };

  return (
    <VistaListasSeguimiento
      cursos={consultas.cursos}
      cursoId={consultas.cursoId}
      onSeleccionarCurso={seleccionarCurso}
      lista={consultas.lista}
      cargando={consultas.cargando}
      error={consultas.error}
      onCrearColumna={comandos.crearColumna}
      creandoColumna={comandos.creandoColumna}
      onEliminarColumna={comandos.eliminarColumna}
      eliminandoColumnaId={comandos.eliminandoColumnaId}
      valorDeCelda={comandos.valorDeCelda}
      onAlternarMarca={comandos.alternarMarca}
      onEscribirNota={comandos.escribirNota}
      cantidadCambios={comandos.cambios.size}
      guardando={comandos.guardando}
      onGuardar={comandos.guardarCambios}
      onDescartar={comandos.descartarCambios}
      puedeEditar={permisos.puedeEditar}
    />
  );
}

export default ListasSeguimientoAdmin;
