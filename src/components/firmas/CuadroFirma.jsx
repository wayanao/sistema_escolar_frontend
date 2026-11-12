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
 * - la firma guardada (o "sin firma"), como saldría sobre la raya, con los
 *   botones para cambiarla o quitarla;
 * - "dibujo": el recuadro para firmar con el dedo;
 * - "foto": cómo va a salir la foto ya limpia, antes de guardarla.
 */
export default function CuadroFirma({
  titulo,
  descripcion,
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

  const abrirFoto = () => entradaFotoRef.current?.click();
  const fotoElegida = (evento) => {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";
    if (archivo) onElegirFoto(archivo);
  };

  return (
    <section className="bg-white rounded-lg shadow border border-slate-200 p-6">
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
        <FirmaGuardada
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
            >
              Guardar firma
            </BotonPrincipal>
            <BotonSecundario onClick={onCancelar}>Cancelar</BotonSecundario>
          </Acciones>
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
            >
              Guardar firma
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

function FirmaGuardada({ firma, guardando, onSubirFoto, onAbrirDibujo, onQuitar }) {
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
        {firma && (
          <button
            type="button"
            onClick={onQuitar}
            disabled={guardando}
            className="rounded px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Quitar firma
          </button>
        )}
      </Acciones>
      <p className="text-xs text-slate-500">
        Para la foto: firma con lapicero oscuro en una hoja blanca y tómale la foto de cerca,
        con buena luz. La app deja solo la firma.
      </p>
    </div>
  );
}

/** La firma sobre una raya, como sale en el boletín. */
function MuestraFirma({ imagen }) {
  return (
    <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-6 pt-3 pb-4">
      <div className="flex h-24 items-end justify-center">
        {imagen ? (
          <img src={imagen} alt="Firma" className="max-h-24 max-w-full object-contain" />
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

function BotonPrincipal({ children, ...props }) {
  return (
    <button
      type="button"
      className="rounded bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 disabled:opacity-50"
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
