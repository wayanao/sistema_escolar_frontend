import SpinnerView from "./SpinnerView";

// Aviso para las acciones que pueden tardar (copiar la configuración,
// activar el año): qué está pasando, que puede tardar y qué no hacer
// mientras tanto.
export default function AvisoTrabajandoView({ titulo, detalle }) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-900 sm:p-4"
    >
      <SpinnerView className="mt-0.5" />
      <div className="min-w-0">
        <p className="font-semibold">{titulo}</p>
        <p className="mt-1 text-sm">{detalle}</p>
      </div>
    </div>
  );
}
