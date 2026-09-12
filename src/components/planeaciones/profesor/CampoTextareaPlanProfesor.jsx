const campoBase =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100";

export default function CampoTextareaPlanProfesor({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  color,
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
        {color && (
          <span
            className={`h-4 w-1 shrink-0 rounded-full ${color}`}
            aria-hidden="true"
          />
        )}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={campoBase}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
