import { LIMITES_TEXTO } from "../../utils/admisiones/formularios";

// Piezas de los formularios de admisión: etiqueta unida a su campo (`htmlFor`)
// y el error debajo, enlazado con `aria-describedby`. Solo presentan.

export const claseCampo =
  "w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-600";

const idDe = (campo) => `admision-${campo}`;

function Envoltura({ campo, etiqueta, error, ancho, children }) {
  return (
    <div className={ancho ? "md:col-span-2" : ""}>
      <label htmlFor={idDe(campo)} className="mb-1 block text-sm font-medium text-gray-700">
        {etiqueta}
      </label>
      {children}
      {error && (
        <p id={`${idDe(campo)}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const atributosComunes = ({ campo, error, deshabilitado }) => ({
  id: idDe(campo),
  disabled: deshabilitado,
  "aria-invalid": error ? true : undefined,
  "aria-describedby": error ? `${idDe(campo)}-error` : undefined,
  className: claseCampo,
});

export function CampoTexto({ campo, etiqueta, valor, error, deshabilitado, ancho, tipo = "text", onCambiar }) {
  return (
    <Envoltura campo={campo} etiqueta={etiqueta} error={error} ancho={ancho}>
      <input
        type={tipo}
        value={valor}
        maxLength={LIMITES_TEXTO[campo]}
        onChange={(evento) => onCambiar(campo, evento.target.value)}
        {...atributosComunes({ campo, error, deshabilitado })}
      />
    </Envoltura>
  );
}

export function CampoArea({ campo, etiqueta, valor, error, deshabilitado, onCambiar }) {
  return (
    <Envoltura campo={campo} etiqueta={etiqueta} error={error} ancho>
      <textarea
        rows={3}
        value={valor}
        maxLength={LIMITES_TEXTO[campo]}
        onChange={(evento) => onCambiar(campo, evento.target.value)}
        {...atributosComunes({ campo, error, deshabilitado })}
      />
    </Envoltura>
  );
}

// `opciones`: `[{ valor, etiqueta }]`.
export function CampoSelect({ campo, etiqueta, valor, opciones, vacio, error, deshabilitado, onCambiar }) {
  return (
    <Envoltura campo={campo} etiqueta={etiqueta} error={error}>
      <select
        value={valor}
        onChange={(evento) => onCambiar(campo, evento.target.value)}
        {...atributosComunes({ campo, error, deshabilitado })}
      >
        <option value="">{vacio}</option>
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
    </Envoltura>
  );
}

export function Subtitulo({ children }) {
  return (
    <h3 className="mt-2 border-b pb-2 text-lg font-medium text-gray-900 md:col-span-2">
      {children}
    </h3>
  );
}
