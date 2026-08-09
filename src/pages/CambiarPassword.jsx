import CambiarPasswordView from "../components/autenticacion/CambiarPasswordView";
import { useCambiarPassword } from "../hooks/autenticacion/useCambiarPassword";

function CambiarPassword() {
  const {
    passwordActual,
    setPasswordActual,
    passwordNueva,
    setPasswordNueva,
    confirmacion,
    setConfirmacion,
    saving,
    guardar,
  } = useCambiarPassword();

  return (
    <CambiarPasswordView
      passwordActual={passwordActual}
      passwordNueva={passwordNueva}
      confirmacion={confirmacion}
      guardando={saving}
      onCambiarPasswordActual={setPasswordActual}
      onCambiarPasswordNueva={setPasswordNueva}
      onCambiarConfirmacion={setConfirmacion}
      onGuardar={guardar}
    />
  );
}

export default CambiarPassword;
