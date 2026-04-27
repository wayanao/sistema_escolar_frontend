import AdministrarTiposPago from "../components/AdministrarTiposPago";

function TiposPagosAdmin() {
    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    ⚙️ Tipos de Pago y Cobros Administrativos
                </h1>
                <p className="text-gray-600">
                    Administra los conceptos de recaudo para la institución (ej: Certificados, Derechos de Grado, Matrícula).
                </p>
            </div>
            
            <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                <AdministrarTiposPago />
            </div>
        </div>
    );
}

export default TiposPagosAdmin;
