import { useEffect } from "react";
import CierreLanding from "../components/landing/CierreLanding";
import CintaModulos from "../components/landing/CintaModulos";
import ConfianzaLanding from "../components/landing/ConfianzaLanding";
import DiaConAuligo from "../components/landing/DiaConAuligo";
import NavLanding from "../components/landing/NavLanding";
import PasosLanding from "../components/landing/PasosLanding";
import PestanasRoles from "../components/landing/PestanasRoles";
import PieLanding from "../components/landing/PieLanding";
import PortadaLanding from "../components/landing/PortadaLanding";
import PreguntasLanding from "../components/landing/PreguntasLanding";
import ProblemasLanding from "../components/landing/ProblemasLanding";
import {
  CONFIANZA,
  MODULOS_CINTA,
  PASOS,
  PLANILLA_DEMO,
  PORTADA,
  PREGUNTAS,
  PROBLEMAS,
  ROLES,
  SECCIONES_LANDING,
  UN_DIA,
} from "../utils/landing/contenido";

// Clase que hace suave el salto a cada sección. Solo vive mientras la landing
// está abierta, y se ignora si el equipo pide reducir el movimiento.
const DESPLAZAMIENTO_SUAVE = "motion-safe:scroll-smooth";

// Portada pública: la ve quien entra a la dirección principal sin sesión.
// `rutaIngreso` llega desde App, dueño de las rutas de sesión.
function Landing({ rutaIngreso }) {
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.add(DESPLAZAMIENTO_SUAVE);
    return () => raiz.classList.remove(DESPLAZAMIENTO_SUAVE);
  }, []);

  return (
    <div className="notranslate min-h-screen bg-white text-slate-900" translate="no">
      <NavLanding secciones={SECCIONES_LANDING} rutaIngreso={rutaIngreso} />
      <main>
        <PortadaLanding portada={PORTADA} planilla={PLANILLA_DEMO} rutaIngreso={rutaIngreso} />
        <CintaModulos modulos={MODULOS_CINTA} />
        <ProblemasLanding problemas={PROBLEMAS} />
        <PestanasRoles roles={ROLES} />
        <DiaConAuligo momentos={UN_DIA} />
        <ConfianzaLanding puntos={CONFIANZA} />
        <PasosLanding pasos={PASOS} />
        <PreguntasLanding preguntas={PREGUNTAS} />
        <CierreLanding rutaIngreso={rutaIngreso} />
      </main>
      <PieLanding secciones={SECCIONES_LANDING} anio={new Date().getFullYear()} />
    </div>
  );
}

export default Landing;
