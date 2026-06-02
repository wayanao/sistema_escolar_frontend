import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../utils/api";

function passwordErrors(value) {
  const errors = [];
  if ((value || "").length < 10) errors.push("minimo 10 caracteres");
  if (!/[A-Z]/.test(value || "")) errors.push("una mayuscula");
  if (!/[a-z]/.test(value || "")) errors.push("una minuscula");
  if (!/[0-9]/.test(value || "")) errors.push("un numero");
  return errors;
}

function CambiarPassword() {
  const navigate = useNavigate();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [saving, setSaving] = useState(false);

  const guardar = async (event) => {
    event.preventDefault();

    const errors = passwordErrors(passwordNueva);
    if (errors.length) {
      Swal.fire({
        icon: "warning",
        title: "Password debil",
        text: `La nueva password debe incluir ${errors.join(", ")}.`,
      });
      return;
    }
    if (passwordNueva !== confirmacion) {
      Swal.fire({ icon: "warning", title: "Revisa la confirmacion", text: "Las passwords no coinciden." });
      return;
    }
    if (passwordActual === passwordNueva) {
      Swal.fire({ icon: "warning", title: "Usa una password nueva", text: "No puede ser igual a la temporal." });
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/cambiar-password", {
        password_actual: passwordActual,
        password_nueva: passwordNueva,
      });

      const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
      if (usuario) {
        localStorage.setItem("usuario", JSON.stringify({ ...usuario, debe_cambiar_password: false }));
      }

      Swal.fire({
        icon: "success",
        title: "Password actualizada",
        timer: 1200,
        showConfirmButton: false,
      }).then(() => navigate("/dashboard-admin", { replace: true }));
    } catch (err) {
      const detail = err.response?.data?.detail;
      Swal.fire({
        icon: "error",
        title: "No se pudo cambiar",
        text: typeof detail === "string" ? detail : "Revisa la password temporal e intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <form onSubmit={guardar} className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Primer ingreso</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Cambia tu password</h1>
        </div>

        <label className="mb-4 block text-sm font-semibold text-slate-800">
          Password temporal
          <input
            type="password"
            autoComplete="current-password"
            value={passwordActual}
            onChange={(event) => setPasswordActual(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="mb-4 block text-sm font-semibold text-slate-800">
          Nueva password
          <input
            type="password"
            autoComplete="new-password"
            value={passwordNueva}
            onChange={(event) => setPasswordNueva(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <label className="mb-6 block text-sm font-semibold text-slate-800">
          Confirmar nueva password
          <input
            type="password"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(event) => setConfirmacion(event.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar password"}
        </button>
      </form>
    </div>
  );
}

export default CambiarPassword;
