import { useEffect, useMemo } from "react";
import usePrintConfig from "../../hooks/certificadosImpresion/usePrintConfig";
import { obtenerTamanoEscudo } from "../../utils/certificadosImpresion/tamanoEscudo";
import { obtenerTamanoNombreColegio } from "../../utils/certificadosImpresion/tamanoNombreColegio";
import { obtenerTamanoEslogan } from "../../utils/certificadosImpresion/tamanoEslogan";
import "../../styles/print.css";

/**
 * Wrapper unificado para impresos. Aplica la identidad institucional
 * del tenant y la plantilla activa para `tipo`.
 *
 * Tipos validos: boletin | voucher_pago | volante_venta |
 *                reporte_estudiante | observaciones | planeador
 *
 * Props:
 *   - tipo (string, requerido)
 *   - titulo (string)         titulo del documento (ej. "Boletin de Notas")
 *   - subtitulo (string)
 *   - firmas (array)          [{nombre, cargo}, ...] - se ocultan si la plantilla las desactiva
 *   - children                contenido especifico del impreso
 */
export default function DocumentoImprimible({
  tipo,
  titulo,
  subtitulo,
  firmas,
  children,
  className = "",
}) {
  const { branding, plantilla, loading, error } = usePrintConfig(tipo);

  const config = useMemo(() => plantilla?.config_json || {}, [plantilla?.config_json]);

  // Marca el body cuando este wrapper esta montado, para que @media print
  // sepa que debe ocultar todo lo demas. No afecta impresos legacy.
  useEffect(() => {
    document.body.classList.add("di-printing-mode");
    return () => document.body.classList.remove("di-printing-mode");
  }, []);

  const styleVars = useMemo(() => {
    const colorPrimario = branding?.color_primario || "#0f314f";
    const colorSecundario = branding?.color_secundario || "#526775";
    // Sin "color_texto" configurado, cada texto conserva exactamente el color
    // que ya tenia (primario o secundario, segun el elemento). Al configurarlo,
    // ambas variables apuntan al mismo valor y las letras dejan de depender de
    // los colores de fondo/resaltado.
    const colorTexto = branding?.configuracion_extra?.color_texto;
    // Cada margen por separado: print.css los mide desde la orilla del papel
    // y le resta la franja blanca que queda por fuera del marco.
    const margenSup = `${config.margen_top || 20}mm`;
    const margenDer = `${config.margen_right || 20}mm`;
    const margenInf = `${config.margen_bottom || 20}mm`;
    const margenIzq = `${config.margen_left || 20}mm`;
    return {
      "--di-color-primario": colorPrimario,
      "--di-color-secundario": colorSecundario,
      "--di-color-texto-principal": colorTexto || colorPrimario,
      "--di-color-texto-secundario": colorTexto || colorSecundario,
      "--di-fuente": config.fuente || "Inter, system-ui, sans-serif",
      "--di-fuente-base": `${config.tamano_fuente_base || 12}px`,
      "--di-margen": `${margenSup} ${margenDer} ${margenInf} ${margenIzq}`,
      "--di-margen-sup": margenSup,
      "--di-margen-der": margenDer,
      "--di-margen-inf": margenInf,
      "--di-margen-izq": margenIzq,
    };
  }, [branding, config]);

  if (loading) {
    return <div className="p-6 text-slate-600">Cargando configuracion de impresion...</div>;
  }

  if (error) {
    // No bloqueamos la impresion: continuamos con defaults.
    console.warn("Error cargando branding/plantilla, usando defaults", error);
  }

  const alineacion = config.encabezado_alineacion || "center";
  const posicionLogo = config.posicion_logo || "izquierda";
  const tamanoEscudo = obtenerTamanoEscudo(config);
  const estiloEscudo = {
    maxHeight: tamanoEscudo,
    maxWidth: Math.round(tamanoEscudo * (posicionLogo === "centro" ? 1.5 : 110 / 70)),
    // Sin ajuste guardado, se conservan las dimensiones naturales anteriores.
    ...(config.tamano_escudo != null && {
      height: tamanoEscudo,
      width: "auto",
      objectFit: "contain",
      flexShrink: 0,
    }),
  };
  const mostrarSecundario = config.mostrar_logo_secundario && branding?.logo_secundario_url;
  const mostrarEslogan = config.mostrar_eslogan !== false;
  const membrete = typeof branding?.configuracion_extra?.membrete === "string"
    ? branding.configuracion_extra.membrete
    : "";
  const mostrarMembrete = config.mostrar_membrete !== false && membrete.trim().length > 0;
  const aprobacionResolucion = typeof branding?.configuracion_extra?.aprobacion_resolucion === "string"
    ? branding.configuracion_extra.aprobacion_resolucion
    : "";
  const mostrarAprobacionResolucion = config.mostrar_aprobacion_resolucion !== false
    && aprobacionResolucion.trim().length > 0;
  const mostrarPie = config.mostrar_pie !== false;
  const mostrarFirmas = config.mostrar_firmas !== false && Array.isArray(firmas) && firmas.length > 0;
  const bordeado = config.borde_documento === true;
  const abrirDialogoPDF = () => window.print();
  const identificadoresInstitucionales = [
    branding?.nit ? `NIT: ${branding.nit}` : null,
    branding?.codigo_dane ? `Código DANE: ${branding.codigo_dane}` : null,
  ].filter(Boolean);
  const datosContacto = [
    branding?.direccion,
    branding?.telefono,
    branding?.email,
  ].filter(Boolean);
  const piePartes = [
    branding?.sitio_web,
    ...datosContacto,
    tipo !== "boletin" ? `Documento generado el ${new Date().toLocaleDateString("es-CO")}` : null,
  ].filter(Boolean);
  const clasesDocumento = className.split(" ").filter(Boolean);
  const usaScrollMovil = clasesDocumento.some((clase) =>
    [
      "di-documento--boletin",
      "di-documento--certificado",
      "di-documento--cartera",
      "di-documento--listas",
      "di-documento--planeador",
    ].includes(clase)
  );

  const logos = (
    <div className="di-encabezado__logos">
      {posicionLogo !== "centro" && branding?.logo_principal_url && (
        <img src={branding.logo_principal_url} alt="logo" style={estiloEscudo} />
      )}
      {mostrarSecundario && (
        <img src={branding.logo_secundario_url} alt="logo secundario" />
      )}
    </div>
  );

  const textosInstitucion = (
    <div className="di-encabezado__textos">
      <h1
        className="di-encabezado__nombre"
        style={config.tamano_nombre_colegio != null
          ? { fontSize: obtenerTamanoNombreColegio(config) }
          : undefined}
      >
        {branding?.nombre_institucion || "Institucion"}
      </h1>
      {mostrarMembrete && (
        <p className="di-encabezado__membrete">{membrete}</p>
      )}
      {identificadoresInstitucionales.length > 0 && (
        <p className="di-encabezado__identificacion">
          {identificadoresInstitucionales.map((dato) => <span key={dato}>{dato}</span>)}
        </p>
      )}
      {mostrarAprobacionResolucion && (
        <p className="di-encabezado__aprobacion">{aprobacionResolucion}</p>
      )}
      {mostrarEslogan && branding?.eslogan && (
        <p
          className="di-encabezado__eslogan"
          style={config.tamano_eslogan != null
            ? { fontSize: obtenerTamanoEslogan(config) }
            : undefined}
        >
          {branding.eslogan}
        </p>
      )}
    </div>
  );

  return (
    <div className={`di-print-root ${usaScrollMovil ? "di-print-root--scroll-mobile" : ""}`} style={styleVars}>
      <article
        className={`di-documento ${className} ${bordeado ? "di-documento--bordeado" : ""}`}
      >
        <table className="di-tabla-documento">
          <thead>
            <tr>
              <td>
                <header className={`di-encabezado di-encabezado--${alineacion}`}>
                  {posicionLogo === "izquierda" && logos}
                  {posicionLogo === "centro" && branding?.logo_principal_url && (
                    <img
                      src={branding.logo_principal_url}
                      alt="logo"
                      style={{ ...estiloEscudo, margin: "0 auto" }}
                    />
                  )}
                  {textosInstitucion}
                  {posicionLogo === "derecha" && logos}
                </header>

                {titulo && <h2 className="di-titulo">{titulo}</h2>}
                {subtitulo && <p className="di-subtitulo">{subtitulo}</p>}
              </td>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                <section className="di-cuerpo">{children}</section>

                {mostrarFirmas && (
                  <section className="di-firmas">
                    {firmas.map((f, i) => (
                      <div key={i} className="di-firmas__bloque">
                        <div className="di-firmas__linea">
                          <strong>{f.nombre}</strong>
                          {f.cargo && <div>{f.cargo}</div>}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                {mostrarPie && piePartes.length > 0 && (
                  <footer className="di-pie">
                    {piePartes.join("  -  ")}
                  </footer>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </article>

      <div className="di-toolbar no-print">
        <button
          type="button"
          onClick={abrirDialogoPDF}
          className="di-toolbar__button di-toolbar__button--primary"
          title="Descargar o guardar como PDF"
        >
          Descargar PDF
        </button>
        <button
          type="button"
          onClick={abrirDialogoPDF}
          className="di-toolbar__button di-toolbar__button--secondary"
          title="Imprimir documento"
        >
          Imprimir
        </button>
      </div>
    </div>
  );
}
