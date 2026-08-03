import { Children } from "react";

export default function VistaPlanillaObservador({
  busqueda,
  onCambiarBusqueda,
  onBuscar,
  children,
}) {
  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        📝 Observador del estudiante
      </h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onBuscar();
        }}
        className="mb-4"
      >
        <input
          placeholder="Buscar estudiante..."
          className="border p-2 mr-2"
          value={busqueda}
          onChange={(event) => onCambiarBusqueda(event.target.value)}
        />
        <button
          type="submit"
          className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700"
        >
          Buscar
        </button>
      </form>

      {Children.map(children, (child) => (
        <div className="border p-3 mb-3">{child}</div>
      ))}
    </div>
  );
}
