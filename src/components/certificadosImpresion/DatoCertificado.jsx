export default function DatoCertificado({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="truncate text-sm font-extrabold uppercase text-slate-900">{value}</p>
    </div>
  );
}
