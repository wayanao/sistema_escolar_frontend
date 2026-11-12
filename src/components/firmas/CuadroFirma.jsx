import { useRef } from "react";

import { formatearFechaFirma } from "../../utils/firmas/imagenFirma";
import CaminitoCargando from "../dashboards/CaminitoCargando";
import RecuadroFirma from "../observador/RecuadroFirma";

/**
 * El cuadro de una firma guardada para el boletín
 * (docs/funcionalidades/FIRMAS_BOLETIN.md). Solo pinta: los datos y las
 * acciones llegan por props desde `useFirmaGuardada` y `useEditorFirma`.
 *
 * Tres momentos:
 * - la firma guardada (o "sin firma"), con los botones para cambiarla o
 *   quitarla;
 * - "dibujo": el recuadro para firmar con el dedo;
 * - "foto": cómo va a salir la foto ya limpia, antes de guardarla.
 *
 * `variante`:
 * - "admin" (Identidad institucional): la firma sobre la raya, como sale en el
 *   boletín, y dos botones, foto o dedo.
 * - "profesor" («Mi curso», paso 3): pensado para profesores mayores, que se
 *   confunden con dos botones parecidos. Un solo botón grande, "Firmar con el
 *   dedo", y la foto como enlace pequeño. Ya guardada, el cuadro es un renglón
 *   para no ocupar la pantalla cada vez que entran.
 */
export default function CuadroFirma({
  titulo,
  descripcion,
  variante = "admin",
  firma,
  cargando = false,
  guardando = false,
  mensajeError = "",
  editor,
  onElegirFoto,
  onAbrirDibujo,
  onCambiarDibujo,
  onGuardar,
  onCancelar,
  onQuitar,
}) {
  const entradaFotoRef = useRef(null);
  const esProfesor = variante === "profesor";
  const textoGuardar = esProfesor ? "Guardar mi firma" : "Guardar firma";

  const abrirFoto = () => entradaFotoRef.current?.click();
  const fotoElegida = (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (archivo) onElegirFoto(archivo);
  };

  const Guardada = esProfesor ? FirmaGuardadaProfesor : FirmaGuardadaAdmin;

  return (
    <section className="bg-white rounded-lg shadow border border-slate-200 p-4 sm:p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-1">{titulo}</h2>
      {descripcion && <p className="text-sm text-slate-600 mb-4">{descripcion}</p>}

      {mensajeError && (
        <p role="alert" className="mb-4 rounded border border-red-300 bg-red-100 p-3 text-sm text-red-800">
          {mensajeError}
        </p>
      )}

      {cargando ? (
        <CaminitoCargando etiqueta="Cargando la firma" className="max-w-sm" />
      ) : !editor.modo ? (
        <Guardada
          firma={firma}
          guardando={guardando}
          onSubirFoto={abrirFoto}
          onAbrirDibujo={onAbrirDibujo}
          onQuitar={onQuitar}
        />
      ) : editor.modo === "dibujo" ? (
        <div className="space-y-3 max-w-xl">
          <RecuadroFirma onCambio={onCambiarDibujo} etiqueta="Recuadro para firmar" />
          {editor.error && <AvisoError texto={editor.error} />}
          <Acciones>
            <BotonPrincipal
              onClick={onGuardar}
              disabled={!editor.imagen || editor.preparando || guardando}
              grande={esProfesor}
            >
              {textoGuardar}
            </BotonPrincipal>
            <BotonSecundario onClick={onCancelar}>Cancelar</BotonSecundario>
          </Acciones>
          {esProfesor && (
            <EnlaceFoto onClick={abrirFoto}>¿Prefieres una foto de tu firma? Súbela aquí</EnlaceFoto>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {editor.preparando ? (
            <CaminitoCargando etiqueta="Preparando la foto" className="max-w-sm" />
          ) : editor.error ? (
            <AvisoError texto={editor.error} />
          ) : (
            editor.imagen && (
              <>
                <p className="text-sm font-semibold text-slate-700">Así va a salir:</p>
                <MuestraFirma imagen={editor.imagen} />
              </>
            )
          )}
          <Acciones>
            <BotonPrincipal
              onClick={onGuardar}
              disabled={!editor.imagen || editor.preparando || guardando}
              grande={esProfesor}
            >
              {textoGuardar}
            </BotonPrincipal>
            <BotonSecundario onClick={abrirFoto}>Elegir otra foto</BotonSecundario>
            <BotonSecundario onClick={onCancelar}>Cancelar</BotonSecundario>
          </Acciones>
        </div>
      )}

      <input
        ref={entradaFotoRef}
        type="file"
        accept="image/*"
        onChange={fotoElegida}
        className="hidden"
        data-testid="entrada-foto-firma"
      />
    </section>
  );
}

function FirmaGuardadaAdmin({ firma, guardando, onSubirFoto, onAbrirDibujo, onQuitar }) {
  return (
    <div className="space-y-3">
      <MuestraFirma imagen={firma?.imagen} />
      <p className="text-xs text-slate-500">
        {firma
          ? `Guardada el ${formatearFechaFirma(firma.actualizado_en)}.`
          : "Todavía no hay firma guardada: los boletines salen con la raya vacía, para firmar a mano."}
      </p>
      <Acciones>
        <BotonPrincipal onClick={onSubirFoto} disabled={guardando}>
          {firma ? "Cambiar con una foto" : "Subir foto de la firma"}
        </BotonPrincipal>
        <BotonSecundario onClick={onAbrirDibujo} disabled={guardando}>
          {firma ? "Cambiar firmando aquí" : "Firmar aquí con el dedo"}
        </BotonSecundario>
        {firma && <BotonQuitar onClick={onQuitar} disabled={guardando}>Quitar firma</BotonQuitar>}
      </Acciones>
      <p className="text-xs text-slate-500">
        Para la foto: firma con lapicero oscuro en una hoja blanca y tómale la foto de cerca,
        con buena luz. La app deja solo la firma.
      </p>
    </div>
  );
}

function FirmaGuardadaProfesor({ firma, guardando, onSubirFoto, onAbrirDibujo, onQuitar }) {
  if (!firma) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">
          Todavía no has guardado tu firma: los boletines de tu curso salen con la raya vacía.
        </p>
        <BotonPrincipal onClick={onAbrirDibujo} disabled={guardando} grande>
          Firmar con el dedo
        </BotonPrincipal>
        <div>
          <EnlaceFoto onClick={onSubirFoto} disabled={guardando}>
            o subir una foto de tu firma
          </EnlaceFoto>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <MuestraFirma imagen={firma.imagen} compacta />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ Tu firma ya sale en los boletines de tu curso.
        </p>
        <p className="text-xs text-slate-500">Guardada el {formatearFechaFirma(firma.actualizado_en)}.</p>
      </div>
      <Acciones>
        <BotonSecundario onClick={onAbrirDibujo} disabled={guardando}>
          Cambiar mi firma
        </BotonSecundario>
        <BotonQuitar onClick={onQuitar} disabled={guardando}>Quitar mi firma</BotonQuitar>
      </Acciones>
    </div>
  );
}

/** La firma sobre una raya, como sale en el boletín. */
function MuestraFirma({ imagen, compacta = false }) {
  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white ${
        compacta ? "w-full max-w-[220px] shrink-0 px-4 pt-2 pb-2" : "max-w-sm px-6 pt-3 pb-4"
      }`}
    >
      <div className={`flex items-end justify-center ${compacta ? "h-14" : "h-24"}`}>
        {imagen ? (
          <img
            src={imagen}
            alt="Firma"
            className={`max-w-full object-contain ${compacta ? "max-h-14" : "max-h-24"}`}
          />
        ) : (
          <span className="self-center text-sm text-slate-400">Sin firma</span>
        )}
      </div>
      <div className="border-t border-slate-500" />
    </div>
  );
}

function AvisoError({ texto }) {
  return (
    <p role="alert" className="max-w-xl rounded border border-red-300 bg-red-100 p-3 text-sm text-red-800">
      {texto}
    </p>
  );
}

function Acciones({ children }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function BotonPrincipal({ children, grande = false, ...props }) {
  return (
    <button
      type="button"
      className={`rounded bg-purple-600 font-semibold text-white shadow hover:bg-purple-800 disabled:opacity-50 ${
        grande ? "w-full px-6 py-3 text-base sm:w-auto" : "px-4 py-2 text-sm"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function BotonSecundario({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

function BotonQuitar({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}

/** La foto como opción secundaria: un enlace, no otro botón igual. */
function EnlaceFoto({ children, ...props }) {
  return (
    <button
      type="button"
      className="text-sm font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900 disabled:opacity-50"
      {...props}
    >
      {children}
    </button>
  );
}
