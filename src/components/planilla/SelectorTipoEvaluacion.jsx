function SelectorTipoEvaluacion({ value, onChange }) {
    return (
        <div className="min-w-0 py-1 sm:col-span-2 xl:col-span-1">
            <label className="block text-[10px] font-black uppercase tracking-[0.14em] text-purple-700">
                Tipo de calificación
            </label>
            <select
                className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-bold text-slate-900 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="numerica">Numérica (1 a 5)</option>
                <option value="desarrollo">Caritas / Desarrollo infantil</option>
            </select>
        </div>
    );
}

export default SelectorTipoEvaluacion;
