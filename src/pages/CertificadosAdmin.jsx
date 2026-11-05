import { useState } from "react";

import CertificadoAprobadoPreview from "../components/certificadosImpresion/CertificadoAprobadoPreview";
import CertificadoConductaPreview from "../components/certificadosImpresion/CertificadoConductaPreview";
import CertificadoMatriculaPreview from "../components/certificadosImpresion/CertificadoMatriculaPreview";
import CertificadoNotasPreview from "../components/certificadosImpresion/CertificadoNotasPreview";
import CertificadoPazSalvoPreview from "../components/certificadosImpresion/CertificadoPazSalvoPreview";
import ReporteParcialPreview from "../components/certificadosImpresion/ReporteParcialPreview";
import SeleccionCertificados from "../components/certificadosImpresion/SeleccionCertificados";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useConsultasCertificadosAdmin from "../hooks/certificadosImpresion/useConsultasCertificadosAdmin";
import { ESTADO_CERRADO } from "../utils/anioLectivo";

// Certificados con el formato de los modelos del colegio, por tipo.
const VISTAS_CERTIFICADO_FORMAL = {
  matricula: CertificadoMatriculaPreview,
  conducta: CertificadoConductaPreview,
  aprobado: CertificadoAprobadoPreview,
  "paz-salvo": CertificadoPazSalvoPreview,
};

export default function CertificadosAdmin() {
  const [tabActiva, setTabActiva] = useState("notas");
  // Solo consulta e imprime: el año elegido cambia qué se ve, no hay botones
  // que esconder.
  const { anioSeleccionado, parametros } = useAnioLectivo();
  const consultas = useConsultasCertificadosAdmin({
    parametrosAnio: parametros,
    anioLectivoPropuesto: anioSeleccionado?.anio,
    anioCerrado: anioSeleccionado?.estado === ESTADO_CERRADO,
  });

  if (consultas.certificado) {
    return (
      <CertificadoNotasPreview
        certificado={consultas.certificado}
        onBack={consultas.limpiarCertificado}
      />
    );
  }

  if (consultas.certificadoFormal) {
    const VistaCertificado = VISTAS_CERTIFICADO_FORMAL[consultas.certificadoFormal.tipo];
    return (
      <VistaCertificado
        certificado={consultas.certificadoFormal}
        onBack={consultas.limpiarCertificadoFormal}
      />
    );
  }

  if (consultas.reporteParcial) {
    return (
      <ReporteParcialPreview
        reporte={consultas.reporteParcial}
        onBack={consultas.limpiarReporteParcial}
      />
    );
  }

  return (
    <SeleccionCertificados
      anioLectivo={consultas.anioLectivo}
      busqueda={consultas.busqueda}
      cursoSeleccionado={consultas.cursoSeleccionado}
      cursos={consultas.cursos}
      cursosPorId={consultas.cursosPorId}
      deudaPazSalvo={consultas.deudaPazSalvo}
      error={consultas.error}
      estadoFiltro={consultas.estadoFiltro}
      estudiantes={consultas.estudiantesFiltrados}
      generandoCurso={consultas.generandoCurso}
      generandoId={consultas.generandoId}
      loading={consultas.loading}
      materiaReporte={consultas.materiaReporte}
      materias={consultas.materias}
      periodo={consultas.periodo}
      periodoReporte={consultas.periodoReporte}
      tabActiva={tabActiva}
      onCambiarAnioLectivo={consultas.setAnioLectivo}
      onCambiarBusqueda={consultas.setBusqueda}
      onCambiarCurso={consultas.setCursoSeleccionado}
      onCambiarEstado={consultas.setEstadoFiltro}
      onCambiarMateriaReporte={consultas.setMateriaReporte}
      onCambiarPeriodo={consultas.setPeriodo}
      onCambiarPeriodoReporte={consultas.setPeriodoReporte}
      onCambiarTab={(tab) => {
        setTabActiva(tab);
        consultas.limpiarError();
        consultas.limpiarDeudaPazSalvo();
      }}
      onCerrarDeudaPazSalvo={consultas.limpiarDeudaPazSalvo}
      onGenerarCurso={consultas.generarReporteParcialCurso}
      onGenerarEstudiante={(estudianteId) =>
        consultas.generarSegunTab(tabActiva, estudianteId)}
    />
  );
}
