import { EtiquetaCampoTrabajo, FlechaSelect } from "../SelectorClaseTrabajo";

// Va junto a la clase y el período (SelectorClaseTrabajo) y con su mismo
// aspecto. Solo sale en cursos sin nivel definido.
function SelectorTipoEvaluacion({ value, onChange }) {
    return (
        <div>
            <EtiquetaCampoTrabajo htmlFor="planilla-tipo-calificacion" tono="violet" icono="lista">
                Tipo de calificación
            </EtiquetaCampoTrabajo>
            <div className="relative">
                <select
                    id="planilla-tipo-calificacion"
                    className="min-h-12 w-full appearance-none rounded-xl border border-violet-200 bg-violet-50/60 py-3 pl-4 pr-11 text-base font-semibold text-violet-950 shadow-sm outline-none transition hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                >
                    <option value="numerica">Numérica (1 a 5)</option>
                    <option value="desarrollo">Caritas / Desarrollo infantil</option>
                </select>
                <FlechaSelect className="text-violet-700" />
            </div>
        </div>
    );
}

export default SelectorTipoEvaluacion;
