import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SuperAdminDashboard from "./SuperAdminDashboard";

const { apiMock, swalFireMock, showValidationMessageMock } = vi.hoisted(() => ({
    apiMock: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
    swalFireMock: vi.fn(),
    showValidationMessageMock: vi.fn(),
}));

vi.mock("../utils/api", () => ({ default: apiMock }));

vi.mock("sweetalert2", () => ({
    default: { fire: swalFireMock, showValidationMessage: showValidationMessageMock },
}));

const tenants = [
    {
        id: 1,
        nombre: "Colegio Uno",
        subdominio: "colegio_uno",
        esquema_db: "tenant_uno",
        fecha_proximo_pago: "2026-09-01",
        dias_gracia: 5,
        estado: "activo",
    },
    {
        id: 2,
        nombre: "Colegio Dos",
        subdominio: "colegio_dos",
        esquema_db: "tenant_dos",
        fecha_proximo_pago: null,
        estado: "en_mora",
        estado_manual: "activo",
    },
    {
        id: 3,
        nombre: "Colegio Tres",
        subdominio: "colegio_tres",
        esquema_db: "tenant_tres",
        fecha_proximo_pago: "2026-05-01",
        dias_gracia: 0,
        estado: "suspendido",
    },
];

const CAMPOS_CREAR = [
    ["tenant-nombre", "input"],
    ["tenant-codigo", "input"],
    ["tenant-admin-nombre", "input"],
    ["tenant-admin-email", "input"],
    ["tenant-admin-password", "input"],
    ["tenant-dias-gracia", "input"],
    ["tenant-fecha-inicio", "input"],
    ["tenant-fecha-pago", "input"],
    ["tenant-notas", "textarea"],
];

const VALORES_VALIDOS = {
    "tenant-nombre": "  Colegio Demo  ",
    "tenant-codigo": "  COLEGIO_DEMO  ",
    "tenant-admin-nombre": "  Administrador  ",
    "tenant-admin-email": "  ADMIN@Colegio.com  ",
    "tenant-admin-password": "Password123",
    "tenant-dias-gracia": "5",
    "tenant-fecha-inicio": "2026-08-07",
    "tenant-fecha-pago": "2026-09-07",
    "tenant-notas": "  Plan anual  ",
};

const esperarTabla = () => screen.findByRole("cell", { name: "Colegio Uno" });

const filaDe = (nombre) => screen.getByRole("cell", { name: nombre }).closest("tr");

const selectorEstadoDe = (nombre) => within(filaDe(nombre)).getByRole("combobox");

// `crearColegio` lee sus valores del DOM que pinta SweetAlert. Como el diálogo
// está simulado, la caracterización monta los mismos campos y ejecuta el
// `preConfirm` capturado para fijar el payload y sus validaciones.
const ejecutarPreConfirm = (valores) => {
    const configuracion = swalFireMock.mock.calls.at(-1)[0];
    const creados = CAMPOS_CREAR.map(([id, etiqueta]) => {
        const campo = document.createElement(etiqueta);
        campo.id = id;
        campo.value = valores[id] ?? "";
        document.body.appendChild(campo);
        return campo;
    });

    try {
        return configuracion.preConfirm();
    } finally {
        creados.forEach((campo) => campo.remove());
    }
};

describe("SuperAdminDashboard", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        apiMock.get.mockImplementation((url) => {
            if (url === "/super-admin/tenants") return Promise.resolve({ data: tenants });
            if (url.endsWith("/estado-auditoria")) return Promise.resolve({ data: [] });
            throw new Error(`GET inesperado: ${url}`);
        });
        swalFireMock.mockResolvedValue({ isConfirmed: false });
    });

    it("consulta los tenants al montar y muestra el indicador de carga", async () => {
        render(<SuperAdminDashboard />);

        expect(screen.getByText("Cargando...")).toBeInTheDocument();
        await esperarTabla();
        expect(apiMock.get).toHaveBeenCalledWith("/super-admin/tenants");
        expect(apiMock.get).toHaveBeenCalledTimes(1);
    });

    it("resume los estados contando el total y cada categoría", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        const valorDe = (etiqueta) =>
            screen.getByText(etiqueta).parentElement.querySelector("p:last-child").textContent;

        expect(valorDe("Total")).toBe("3");
        expect(valorDe("Activos")).toBe("1");
        expect(valorDe("En mora")).toBe("1");
        expect(valorDe("Suspendidos")).toBe("1");
        expect(valorDe("Cancelados")).toBe("0");
    });

    it("pinta la fila con sus respaldos de fecha, gracia y estado manual", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        const filaDos = filaDe("Colegio Dos");
        expect(within(filaDos).getByText("Sin fecha")).toBeInTheDocument();
        expect(within(filaDos).getByText("0 dias")).toBeInTheDocument();
        expect(within(filaDos).getByText("Manual: activo")).toBeInTheDocument();

        const filaUno = filaDe("Colegio Uno");
        expect(within(filaUno).getByText("2026-09-01")).toBeInTheDocument();
        expect(within(filaUno).getByText("5 dias")).toBeInTheDocument();
        expect(within(filaUno).queryByText(/^Manual:/)).not.toBeInTheDocument();
    });

    it("muestra el error de carga sin pintar la tabla", async () => {
        apiMock.get.mockRejectedValue(new Error("500"));

        render(<SuperAdminDashboard />);

        expect(await screen.findByText("No se pudieron cargar los colegios.")).toBeInTheDocument();
        expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("muestra el estado vacío cuando no hay tenants", async () => {
        apiMock.get.mockResolvedValue({ data: [] });

        render(<SuperAdminDashboard />);

        expect(await screen.findByText("No hay tenants registrados.")).toBeInTheDocument();
    });

    it("vuelve a consultar los tenants con el botón Actualizar", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

        await waitFor(() => expect(apiMock.get).toHaveBeenCalledTimes(2));
    });

    it("no pide confirmación cuando el estado elegido es el vigente", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.change(selectorEstadoDe("Colegio Uno"), { target: { value: "activo" } });

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(apiMock.patch).not.toHaveBeenCalled();
    });

    it("compara contra el estado manual y no contra el estado calculado", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.change(selectorEstadoDe("Colegio Dos"), { target: { value: "activo" } });

        expect(swalFireMock).not.toHaveBeenCalled();
        expect(apiMock.patch).not.toHaveBeenCalled();
    });

    it("exige motivo para suspender y guarda el cambio recortado", async () => {
        const actualizado = { ...tenants[0], estado: "suspendido", estado_manual: "suspendido" };
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: "  Pago vencido  " });
        apiMock.patch.mockResolvedValue({ data: actualizado });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.change(selectorEstadoDe("Colegio Uno"), { target: { value: "suspendido" } });

        await waitFor(() => {
            expect(apiMock.patch).toHaveBeenCalledWith("/super-admin/tenants/1/estado", {
                estado: "suspendido",
                motivo: "Pago vencido",
            });
        });

        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.icon).toBe("warning");
        expect(confirmacion.title).toBe("Cambiar a suspendido");
        expect(confirmacion.text).toBe("Colegio Uno pasara de activo a suspendido.");
        expect(confirmacion.inputLabel).toBe("Motivo obligatorio");
        expect(confirmacion.confirmButtonColor).toBe("#dc2626");
        expect(confirmacion.inputValidator("   ")).toBe(
            "Escribe el motivo para suspender o cancelar.",
        );
        expect(confirmacion.inputValidator("Pago vencido")).toBeUndefined();
    });

    it("deja el motivo opcional para los estados no críticos", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: false });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.change(selectorEstadoDe("Colegio Tres"), { target: { value: "en_mora" } });

        await waitFor(() => expect(swalFireMock).toHaveBeenCalled());
        const confirmacion = swalFireMock.mock.calls[0][0];
        expect(confirmacion.icon).toBe("question");
        expect(confirmacion.inputLabel).toBe("Motivo opcional");
        expect(confirmacion.confirmButtonColor).toBe("#059669");
        expect(confirmacion.inputValidator("")).toBeUndefined();
        expect(apiMock.patch).not.toHaveBeenCalled();
    });

    it("registra el pago de un colegio vencido y su fila queda activa", async () => {
        // Una fecha lejana: la validación exige que sea posterior a hoy.
        const actualizado = {
            ...tenants[2],
            estado: "activo",
            estado_manual: "activo",
            fecha_proximo_pago: "2099-01-15",
        };
        apiMock.post.mockResolvedValue({ data: actualizado });
        // Monta los campos que pintaría SweetAlert y confirma con su `preConfirm`.
        swalFireMock.mockImplementationOnce(async (configuracion) => {
            const fecha = document.createElement("input");
            fecha.id = "pago-fecha-proximo";
            fecha.value = "2099-01-15";
            const nota = document.createElement("textarea");
            nota.id = "pago-nota";
            nota.value = "  Transferencia  ";
            document.body.append(fecha, nota);
            try {
                return { isConfirmed: true, value: configuracion.preConfirm() };
            } finally {
                fecha.remove();
                nota.remove();
            }
        });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(
            within(filaDe("Colegio Tres")).getByRole("button", { name: "Registrar pago" }),
        );

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/super-admin/tenants/3/pagos", {
                fecha_proximo_pago: "2099-01-15",
                nota: "Transferencia",
            });
        });
        await waitFor(() => {
            expect(within(filaDe("Colegio Tres")).getByText("2099-01-15")).toBeInTheDocument();
        });
        // La insignia de estado; el selector también tiene una opción "activo".
        expect(
            within(filaDe("Colegio Tres")).getByText("activo", { selector: "span" }),
        ).toBeInTheDocument();
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "success",
            title: "Pago registrado",
            text: "Colegio Tres quedó activo. Próximo pago: 2099-01-15.",
        });
    });

    it("avisa sin guardar cuando el cambio de estado falla", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: "Motivo" });
        apiMock.patch.mockRejectedValue(new Error("500"));

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.change(selectorEstadoDe("Colegio Uno"), { target: { value: "cancelado" } });

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith({
                icon: "error",
                title: "No se pudo actualizar",
                text: "Revisa tu sesión o intenta nuevamente.",
            });
        });
        expect(screen.getByRole("cell", { name: "Colegio Uno" })).toBeInTheDocument();
    });

    it("avisa cuando el tenant no tiene historial de estados", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(within(filaDe("Colegio Uno")).getByRole("button", { name: "Ver" }));

        await waitFor(() => {
            expect(apiMock.get).toHaveBeenCalledWith("/super-admin/tenants/1/estado-auditoria");
        });
        expect(swalFireMock).toHaveBeenCalledWith({
            icon: "info",
            title: "Sin historial",
            text: "Colegio Uno todavía no tiene cambios de estado registrados.",
        });
    });

    it("escapa el contenido del historial antes de pintarlo", async () => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/super-admin/tenants") return Promise.resolve({ data: tenants });
            if (url.endsWith("/estado-auditoria")) {
                return Promise.resolve({
                    data: [
                        {
                            creado_en: null,
                            estado_anterior: "activo",
                            estado_nuevo: "suspendido",
                            motivo: "<script>alerta()</script>",
                            super_admin_nombre: "Soporte & Cia",
                        },
                    ],
                });
            }
            throw new Error(`GET inesperado: ${url}`);
        });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(within(filaDe("Colegio Uno")).getByRole("button", { name: "Ver" }));

        await waitFor(() => expect(swalFireMock).toHaveBeenCalled());
        const dialogo = swalFireMock.mock.calls.at(-1)[0];
        expect(dialogo.title).toBe("Historial de Colegio Uno");
        expect(dialogo.html).toContain("&lt;script&gt;alerta()&lt;/script&gt;");
        expect(dialogo.html).not.toContain("<script>");
        expect(dialogo.html).toContain("Soporte &amp; Cia");
        expect(dialogo.html).toContain("activo → suspendido");
    });

    it("avisa cuando el historial no se puede cargar", async () => {
        apiMock.get.mockImplementation((url) => {
            if (url === "/super-admin/tenants") return Promise.resolve({ data: tenants });
            return Promise.reject(new Error("500"));
        });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(within(filaDe("Colegio Uno")).getByRole("button", { name: "Ver" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenCalledWith({
                icon: "error",
                title: "No se pudo cargar",
                text: "Intenta nuevamente.",
            });
        });
    });

    it("normaliza el payload de creación recortando y bajando a minúsculas", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        expect(ejecutarPreConfirm(VALORES_VALIDOS)).toEqual({
            nombre: "Colegio Demo",
            codigo: "colegio_demo",
            admin_nombre: "Administrador",
            admin_email: "admin@colegio.com",
            admin_password: "Password123",
            fecha_inicio: "2026-08-07",
            fecha_proximo_pago: "2026-09-07",
            dias_gracia: 5,
            notas: "Plan anual",
        });
        expect(showValidationMessageMock).not.toHaveBeenCalled();
    });

    it("rechaza el alta cuando falta un dato obligatorio, el correo o la contraseña", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-nombre": "  " })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "Completa colegio, codigo y admin inicial.",
        );

        expect(
            ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-admin-email": "correo-malo" }),
        ).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "Escribe un correo valido para el admin.",
        );

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-admin-password": "corta1A" })).toBe(
            false,
        );
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "La password temporal debe incluir minimo 10 caracteres.",
        );

        expect(
            ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-admin-password": "solominusculas" }),
        ).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "La password temporal debe incluir una mayuscula, un numero.",
        );
    });

    it("rechaza el alta cuando el código o las fechas son inválidos", async () => {
        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-codigo": "ab" })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "El codigo debe usar minusculas, numeros o guion bajo, minimo 3 caracteres.",
        );

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-fecha-inicio": "" })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "Completa las fechas de suscripcion.",
        );

        expect(
            ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-fecha-pago": "2026-08-06" }),
        ).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "El proximo pago no puede ser anterior al inicio.",
        );

        expect(ejecutarPreConfirm({ ...VALORES_VALIDOS, "tenant-dias-gracia": "-1" })).toBe(false);
        expect(showValidationMessageMock).toHaveBeenLastCalledWith(
            "Los dias de gracia no pueden ser negativos.",
        );
    });

    it("registra el colegio confirmado y lo agrega a la lista", async () => {
        const nuevo = {
            id: 4,
            nombre: "Colegio Demo",
            subdominio: "colegio_demo",
            esquema_db: "tenant_demo",
            fecha_proximo_pago: "2026-09-07",
            dias_gracia: 5,
            estado: "activo",
        };
        const payload = { nombre: "Colegio Demo", codigo: "colegio_demo" };
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: payload });
        apiMock.post.mockResolvedValue({ data: nuevo });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        await waitFor(() => {
            expect(apiMock.post).toHaveBeenCalledWith("/super-admin/tenants", payload);
        });
        expect(await screen.findByRole("cell", { name: "Colegio Demo" })).toBeInTheDocument();
        expect(swalFireMock).toHaveBeenLastCalledWith({
            icon: "success",
            title: "Colegio creado",
            text: "Colegio Demo ya puede iniciar sesion.",
        });
    });

    it("muestra el detalle del backend cuando la creación falla", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: { nombre: "X" } });
        apiMock.post.mockRejectedValue({ response: { data: { detail: "El codigo ya existe." } } });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenLastCalledWith({
                icon: "error",
                title: "No se pudo crear",
                text: "El codigo ya existe.",
            });
        });
    });

    it("usa el texto genérico cuando el error de creación no trae detalle", async () => {
        swalFireMock.mockResolvedValueOnce({ isConfirmed: true, value: { nombre: "X" } });
        apiMock.post.mockRejectedValue({ response: { data: { detail: [{ msg: "invalido" }] } } });

        render(<SuperAdminDashboard />);
        await esperarTabla();

        fireEvent.click(screen.getByRole("button", { name: "Crear colegio" }));

        await waitFor(() => {
            expect(swalFireMock).toHaveBeenLastCalledWith({
                icon: "error",
                title: "No se pudo crear",
                text: "Revisa los datos e intenta nuevamente.",
            });
        });
    });
});
