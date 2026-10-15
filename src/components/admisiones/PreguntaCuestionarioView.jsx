import { claseCampo } from "./CamposAdmision";

// Una pregunta del anexo de la entrevista (paso E11), según su tipo. Solo
// presenta: avisa con `onCambiar(pregunta, accion, valor)` y quien la usa
// decide qué pasa (ver `aplicarCambio` en utils/admisiones/cuestionario.js).
//
// Sí / No y "una opción" son botones de opción (`radio`) agrupados con su
// pregunta (`fieldset` y `legend`): un lector de pantalla anuncia "elige una"
// y el teclado funciona como en cualquier formulario. "Varias" son casillas
// de verificación (`checkbox`). Las dos se dibujan como cuadritos para
// chulear. Volver a tocar la opción marcada la desmarca.

const idDe = (clave, parte) => `cuestionario-${clave}${parte ? `-${parte}` : ""}`;

function Casilla({ tipo, nombre, etiqueta, marcada, onChange, onClick }) {
  return (
    <label className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 pr-2 text-gray-800">
      <input
        type={tipo}
        name={nombre}
        checked={marcada}
        onChange={onChange}
        onClick={onClick}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 border-gray-400 bg-white text-sm font-bold leading-none text-transparent peer-checked:border-purple-700 peer-checked:bg-purple-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-purple-500 peer-focus-visible:ring-offset-2 peer-disabled:opacity-60"
      >
        ✓
      </span>
      <span>{etiqueta}</span>
    </label>
  );
}

function estaMarcada(pregunta, respuesta, valor) {
  if (pregunta.tipo === "varias") return (respuesta?.marcadas ?? []).includes(valor);
  if (pregunta.tipo === "si_no") return respuesta?.respuesta === valor;
  return respuesta?.opcion === valor;
}

// El cuadro para escribir que abre una respuesta: el detalle de un Sí / No o
// lo de "Otro". `null` si con lo marcado no corresponde.
function cuadroAparte(pregunta, respuesta) {
  if (pregunta.tipo === "si_no") {
    const { detalle } = pregunta;
    if (!detalle || respuesta?.respuesta !== detalle.con) return null;
    return { ...detalle, valor: respuesta.detalle ?? "" };
  }
  if (!pregunta.otro || !estaMarcada(pregunta, respuesta, "otro")) return null;
  return { ...pregunta.otro, valor: respuesta.otro ?? "" };
}

function ConCasillas({ pregunta, respuesta, titulo, idError, mensajeError, deshabilitado, onCambiar }) {
  const varias = pregunta.tipo === "varias";
  const aparte = cuadroAparte(pregunta, respuesta);
  const idAparte = idDe(pregunta.clave, "aparte");

  return (
    <fieldset disabled={deshabilitado} aria-describedby={idError}>
      <legend className="mb-1 text-sm font-medium text-gray-700">{titulo}</legend>
      <div className="flex flex-wrap gap-x-4">
        {(pregunta.opciones ?? []).map(({ valor, etiqueta }) => {
          const marcada = estaMarcada(pregunta, respuesta, valor);
          return (
            <Casilla
              key={valor}
              tipo={varias ? "checkbox" : "radio"}
              nombre={idDe(pregunta.clave)}
              etiqueta={etiqueta}
              marcada={marcada}
              onChange={() => onCambiar(pregunta, varias ? "marcar" : "elegir", valor)}
              // Un radio marcado no avisa `onChange` al tocarlo otra vez.
              onClick={!varias && marcada ? () => onCambiar(pregunta, "elegir", valor) : undefined}
            />
          );
        })}
      </div>
      {aparte && (
        <div className="mt-2">
          <label htmlFor={idAparte} className="mb-1 block text-sm text-gray-700">
            {aparte.texto}
          </label>
          <input
            id={idAparte}
            type="text"
            value={aparte.valor}
            maxLength={aparte.maximo}
            onChange={(evento) => onCambiar(pregunta, "aparte", evento.target.value)}
            className={claseCampo}
          />
        </div>
      )}
      {mensajeError}
    </fieldset>
  );
}

function ConCuadro({ pregunta, respuesta, titulo, error, idError, mensajeError, deshabilitado, onCambiar }) {
  const id = idDe(pregunta.clave);
  const idAyuda = pregunta.ayuda ? idDe(pregunta.clave, "ayuda") : undefined;
  const comunes = {
    id,
    value: respuesta ?? "",
    disabled: deshabilitado,
    onChange: (evento) => onCambiar(pregunta, "escribir", evento.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [idAyuda, idError].filter(Boolean).join(" ") || undefined,
  };

  let cuadro;
  if (pregunta.tipo === "numero") {
    cuadro = (
      <input
        type="number"
        inputMode="numeric"
        step="1"
        min={pregunta.minimo}
        max={pregunta.maximo}
        {...comunes}
        className={`${claseCampo} sm:max-w-[10rem]`}
      />
    );
  } else if (pregunta.tipo === "texto_largo") {
    cuadro = <textarea rows={3} maxLength={pregunta.maximo} {...comunes} className={claseCampo} />;
  } else {
    cuadro = <input type="text" maxLength={pregunta.maximo} {...comunes} className={claseCampo} />;
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
        {titulo}
      </label>
      {cuadro}
      {pregunta.ayuda && (
        <p id={idAyuda} className="mt-1 text-sm text-gray-500">
          {pregunta.ayuda}
        </p>
      )}
      {mensajeError}
    </div>
  );
}

const CON_CASILLAS = new Set(["si_no", "una", "varias"]);

export default function PreguntaCuestionarioView({ pregunta, respuesta, error, deshabilitado, onCambiar }) {
  const idError = error ? idDe(pregunta.clave, "error") : undefined;
  const props = {
    pregunta,
    respuesta,
    titulo: `${pregunta.numero}. ${pregunta.texto}`,
    error,
    idError,
    mensajeError: error && (
      <p id={idError} className="mt-1 text-sm text-red-700">
        {error}
      </p>
    ),
    deshabilitado,
    onCambiar,
  };
  return CON_CASILLAS.has(pregunta.tipo) ? <ConCasillas {...props} /> : <ConCuadro {...props} />;
}
