import { useState } from "react";

import CertificadoMatriculaPreview from "../components/certificadosImpresion/CertificadoMatriculaPreview";
import CertificadoNotasPreview from "../components/certificadosImpresion/CertificadoNotasPreview";
import ReporteParcialPreview from "../components/certificadosImpresion/ReporteParcialPreview";
import SeleccionCertificados from "../components/certificadosImpresion/SeleccionCertificados";
import useAnioLectivo from "../hooks/anioLectivo/useAnioLectivo";
import useConsultasCertificadosAdmin from "../hooks/certificadosImpresion/useConsultasCertificadosAdmin";

export default function CertificadosAdmin() {
  const [tabActiva, setTabActiva] = useState("notas");
  // Solo consulta e imprime: el año elegido cambia qué se ve, no hay botones
  // que esconder.
  const { parametros } = useAnioLectivo();
  const consultas = useConsultasCertificadosAdmin({ parametrosAnio: parametros });

  if (consultas.certificado) {
    return (
      <CertificadoNotasPreview
        certificado={consultas.certificado}
        onBack={consultas.limpiarCertificado}
      />
    );
  }

  if (consultas.certificadoMatricula) {
    return (
      <CertificadoMatriculaPreview
        certificado={consultas.certificadoMatricula}
        onBack={consultas.limpiarCertificadoMatricula}
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
      }}
      onGenerarCurso={consultas.generarReporteParcialCurso}
      onGenerarEstudiante={(estudianteId) =>
        consultas.generarSegunTab(tabActiva, estudianteId)}
    />
  );
}
