import { describe, expect, it } from "vitest";
import {
    ESTADOS_TENANT,
    claseEstadoTenant,
    construirPayloadEstado,
    construirPayloadPago,
    erroresDePassword,
    escapeHtml,
    estadoManualDe,
    fechaIsoDeHoy,
    formatearFechaAuditoria,
    htmlFormularioPago,
    htmlFormularioTenant,
    htmlHistorialTenant,
    mensajeErrorCrearTenant,
    mensajeErrorPago,
    normalizarListaTenants,
    normalizarPayloadTenant,
    requiereMotivoDeEstado,
    resumirTenants,
    sugerirProximoPago,
    sumarUnMes,
    textoConfirmacionEstado,
    textoPagoRegistrado,
    validarFechaPago,
    validarMotivoEstado,
    validarTenantNuevo,
} from "./superAdmin";

const VALORES_VALIDOS = {
    nombre: "  Colegio Demo  ",
    codigo: "  COLEGIO_DEMO  ",
    admin_nombre: "  Administrador  ",
    admin_email: "  ADMIN@Colegio.com  ",
    admin_password: "Password123",
    fecha_inicio: "2026-08-07",
    fecha_proximo_pago: "2026-09-07",
    dias_gracia: "5",
    notas: "  Plan anual  ",
};

const payloadValido = () => normalizarPayloadTenant(VALORES_VALIDOS);

describe("ESTADOS_TENANT", () => {
    it("conserva los cuatro estados y su orden", () => {
        expect(ESTADOS_TENANT).toEqual(["activo", "en_mora", "suspendido", "cancelado"]);
    });
});

describe("escapeHtml", () => {
    it("neutraliza el marcado que llega del backend", () => {
        expect(escapeHtml("<script>alerta()</script>")).toBe(
            "&lt;script&gt;alerta()&lt;/script&gt;",
        );
        expect(escapeHtml('Soporte & "Cia"')).toBe("Soporte &amp; &quot;Cia&quot;");
        expect(escapeHtml("O'Brien")).toBe("O&#039;Brien");
    });

    it("trata los valores ausentes como cadena vacía", () => {
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
});

describe("fechaIsoDeHoy", () => {
    it("recorta la marca de tiempo a la fecha", () => {
        expect(fechaIsoDeHoy(new Date("2026-08-07T15:20:00Z"))).toBe("2026-08-07");
    });

    it("de noche usa la fecha de Colombia, no la UTC", () => {
        expect(fechaIsoDeHoy(new Date("2026-10-01T04:00:00Z"))).toBe("2026-09-30");
    });
});

describe("erroresDePassword", () => {
    it("acepta la contraseña que cumple las cuatro reglas", () => {
        expect(erroresDePassword("Password123")).toEqual([]);
    });

    it("acumula todas las reglas incumplidas", () => {
        expect(erroresDePassword("corta1A")).toEqual(["minimo 10 caracteres"]);
        expect(erroresDePassword("solominusculas")).toEqual(["una mayuscula", "un numero"]);
        expect(erroresDePassword("")).toEqual([
            "minimo 10 caracteres",
            "una mayuscula",
            "una minuscula",
            "un numero",
        ]);
    });
});

describe("normalizarListaTenants", () => {
    it("protege la lista ante respuestas vacías", () => {
        expect(normalizarListaTenants(null)).toEqual([]);
        expect(normalizarListaTenants([{ id: 1 }])).toEqual([{ id: 1 }]);
    });
});

describe("resumirTenants", () => {
    it("cuenta el total y cada estado", () => {
        expect(
            resumirTenants([
                { estado: "activo" },
                { estado: "en_mora" },
                { estado: "activo" },
                { estado: "cancelado" },
            ]),
        ).toEqual({ total: 4, activo: 2, en_mora: 1, suspendido: 0, cancelado: 1 });
    });

    it("cuenta como suspendido al tenant sin estado", () => {
        expect(resumirTenants([{}]).suspendido).toBe(1);
    });

    it("devuelve todo en cero sin tenants", () => {
        expect(resumirTenants([])).toEqual({
            total: 0,
            activo: 0,
            en_mora: 0,
            suspendido: 0,
            cancelado: 0,
        });
    });
});

describe("estadoManualDe", () => {
    it("prefiere el estado manual sobre el calculado", () => {
        expect(estadoManualDe({ estado: "en_mora", estado_manual: "activo" })).toBe("activo");
        expect(estadoManualDe({ estado: "en_mora" })).toBe("en_mora");
    });
});

describe("requiereMotivoDeEstado", () => {
    it("solo suspender y cancelar exigen motivo", () => {
        expect(requiereMotivoDeEstado("suspendido")).toBe(true);
        expect(requiereMotivoDeEstado("cancelado")).toBe(true);
        expect(requiereMotivoDeEstado("activo")).toBe(false);
        expect(requiereMotivoDeEstado("en_mora")).toBe(false);
    });
});

describe("cambio de estado", () => {
    it("describe el cambio desde el estado manual", () => {
        expect(
            textoConfirmacionEstado(
                { nombre: "Colegio Uno", estado: "en_mora", estado_manual: "activo" },
                "suspendido",
            ),
        ).toBe("Colegio Uno pasara de activo a suspendido.");
    });

    it("exige motivo solo en los estados críticos", () => {
        expect(validarMotivoEstado("suspendido", "   ")).toBe(
            "Escribe el motivo para suspender o cancelar.",
        );
        expect(validarMotivoEstado("cancelado", "")).toBeTruthy();
        expect(validarMotivoEstado("suspendido", "Pago vencido")).toBeUndefined();
        expect(validarMotivoEstado("activo", "")).toBeUndefined();
    });

    it("recorta el motivo del payload", () => {
        expect(construirPayloadEstado("suspendido", "  Pago vencido  ")).toEqual({
            estado: "suspendido",
            motivo: "Pago vencido",
        });
        expect(construirPayloadEstado("activo", undefined)).toEqual({
            estado: "activo",
            motivo: "",
        });
    });
});

describe("normalizarPayloadTenant", () => {
    it("recorta, baja a minúsculas y convierte los días de gracia", () => {
        expect(payloadValido()).toEqual({
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
    });

    it("no recorta la contraseña", () => {
        expect(normalizarPayloadTenant({ admin_password: "  Password123  " }).admin_password).toBe(
            "  Password123  ",
        );
    });

    it("usa cero cuando no hay días de gracia", () => {
        expect(normalizarPayloadTenant({}).dias_gracia).toBe(0);
        expect(normalizarPayloadTenant({ dias_gracia: "" }).dias_gracia).toBe(0);
    });
});

describe("validarTenantNuevo", () => {
    it("acepta el payload completo", () => {
        expect(validarTenantNuevo(payloadValido())).toBe("");
    });

    it("exige los datos obligatorios antes que cualquier formato", () => {
        expect(validarTenantNuevo({ ...payloadValido(), nombre: "" })).toBe(
            "Completa colegio, codigo y admin inicial.",
        );
        expect(validarTenantNuevo({ ...payloadValido(), admin_password: "" })).toBe(
            "Completa colegio, codigo y admin inicial.",
        );
    });

    it("valida el correo del admin", () => {
        expect(validarTenantNuevo({ ...payloadValido(), admin_email: "correo-malo" })).toBe(
            "Escribe un correo valido para el admin.",
        );
        expect(validarTenantNuevo({ ...payloadValido(), admin_email: "a@b.co" })).toBe("");
    });

    it("acumula las reglas de la contraseña en un solo mensaje", () => {
        expect(validarTenantNuevo({ ...payloadValido(), admin_password: "solominusculas" })).toBe(
            "La password temporal debe incluir una mayuscula, un numero.",
        );
    });

    it("valida el formato del código", () => {
        expect(validarTenantNuevo({ ...payloadValido(), codigo: "ab" })).toBe(
            "El codigo debe usar minusculas, numeros o guion bajo, minimo 3 caracteres.",
        );
        expect(validarTenantNuevo({ ...payloadValido(), codigo: "con-guion" })).toBeTruthy();
        expect(validarTenantNuevo({ ...payloadValido(), codigo: "colegio_01" })).toBe("");
    });

    it("valida las fechas de suscripción y su orden", () => {
        expect(validarTenantNuevo({ ...payloadValido(), fecha_inicio: "" })).toBe(
            "Completa las fechas de suscripcion.",
        );
        expect(
            validarTenantNuevo({ ...payloadValido(), fecha_proximo_pago: "2026-08-06" }),
        ).toBe("El proximo pago no puede ser anterior al inicio.");
        expect(
            validarTenantNuevo({ ...payloadValido(), fecha_proximo_pago: "2026-08-07" }),
        ).toBe("");
    });

    it("rechaza los días de gracia negativos", () => {
        expect(validarTenantNuevo({ ...payloadValido(), dias_gracia: -1 })).toBe(
            "Los dias de gracia no pueden ser negativos.",
        );
        expect(validarTenantNuevo({ ...payloadValido(), dias_gracia: 0 })).toBe("");
    });
});

describe("mensajeErrorCrearTenant", () => {
    it("muestra el detalle del backend cuando es texto", () => {
        expect(
            mensajeErrorCrearTenant({ response: { data: { detail: "El codigo ya existe." } } }),
        ).toBe("El codigo ya existe.");
    });

    it("usa el texto genérico para cualquier otra forma de error", () => {
        const generico = "Revisa los datos e intenta nuevamente.";

        expect(mensajeErrorCrearTenant({ response: { data: { detail: [{ msg: "x" }] } } })).toBe(
            generico,
        );
        expect(mensajeErrorCrearTenant(new Error("Network"))).toBe(generico);
        expect(mensajeErrorCrearTenant(undefined)).toBe(generico);
    });
});

describe("claseEstadoTenant", () => {
    it("da a cada estado su paleta", () => {
        expect(claseEstadoTenant("activo")).toContain("emerald");
        expect(claseEstadoTenant("en_mora")).toContain("amber");
        expect(claseEstadoTenant("suspendido")).toContain("rose");
        expect(claseEstadoTenant("cancelado")).toContain("slate");
    });

    it("pinta como suspendido cualquier estado desconocido", () => {
        expect(claseEstadoTenant("inventado")).toBe(claseEstadoTenant("suspendido"));
        expect(claseEstadoTenant(undefined)).toBe(claseEstadoTenant("suspendido"));
    });
});

describe("htmlFormularioTenant", () => {
    it("pinta los nueve campos con los identificadores que lee el comando", () => {
        const html = htmlFormularioTenant("2026-08-07");

        [
            "tenant-nombre",
            "tenant-codigo",
            "tenant-admin-nombre",
            "tenant-admin-email",
            "tenant-admin-password",
            "tenant-dias-gracia",
            "tenant-fecha-inicio",
            "tenant-fecha-pago",
            "tenant-notas",
        ].forEach((id) => expect(html).toContain(`id="${id}"`));
    });

    it("precarga las dos fechas de suscripción con el día recibido", () => {
        const html = htmlFormularioTenant("2026-08-07");

        expect(html).toContain('id="tenant-fecha-inicio" type="date" class="swal2-input" value="2026-08-07"');
        expect(html).toContain('id="tenant-fecha-pago" type="date" class="swal2-input" value="2026-08-07"');
        expect(html).toContain('id="tenant-dias-gracia" type="number" min="0" class="swal2-input" value="5"');
    });
});

describe("historial de auditoría", () => {
    it("formatea la fecha y tolera su ausencia", () => {
        expect(formatearFechaAuditoria(null)).toBe("");
        expect(formatearFechaAuditoria("2026-08-07T15:20:00Z")).toContain("2026");
    });

    it("escapa el contenido de cada fila", () => {
        const html = htmlHistorialTenant([
            {
                creado_en: null,
                estado_anterior: "activo",
                estado_nuevo: "suspendido",
                motivo: "<script>alerta()</script>",
                super_admin_nombre: "Soporte & Cia",
            },
        ]);

        expect(html).toContain("&lt;script&gt;alerta()&lt;/script&gt;");
        expect(html).not.toContain("<script>");
        expect(html).toContain("Soporte &amp; Cia");
        expect(html).toContain("activo → suspendido");
    });

    it("usa los respaldos de motivo y responsable", () => {
        const html = htmlHistorialTenant([
            { estado_anterior: "activo", estado_nuevo: "en_mora", super_admin_email: "s@x.co" },
        ]);

        expect(html).toContain("Sin motivo");
        expect(html).toContain("s@x.co");
    });

    it("pinta la tabla aunque no haya filas", () => {
        const html = htmlHistorialTenant([]);

        expect(html).toContain("Responsable");
        expect(html).not.toContain("<tr>\n");
    });
});

describe("sumarUnMes", () => {
    it("pasa al mismo día del mes siguiente", () => {
        expect(sumarUnMes("2026-10-26")).toBe("2026-11-26");
    });

    it("cambia de año en diciembre", () => {
        expect(sumarUnMes("2026-12-15")).toBe("2027-01-15");
    });

    it("usa el último día cuando el mes siguiente es más corto", () => {
        expect(sumarUnMes("2026-01-31")).toBe("2026-02-28");
        expect(sumarUnMes("2028-01-31")).toBe("2028-02-29");
        expect(sumarUnMes("2026-03-31")).toBe("2026-04-30");
    });
});

describe("sugerirProximoPago", () => {
    it("conserva el ciclo: un mes después del próximo pago vigente", () => {
        expect(sugerirProximoPago("2026-10-20", "2026-10-26")).toBe("2026-11-20");
    });

    it("con un atraso de meses, propone un mes después de hoy", () => {
        expect(sugerirProximoPago("2026-07-01", "2026-10-26")).toBe("2026-11-26");
    });

    it("sin fecha vigente, propone un mes después de hoy", () => {
        expect(sugerirProximoPago(null, "2026-10-26")).toBe("2026-11-26");
    });
});

describe("validarFechaPago", () => {
    it("exige una fecha", () => {
        expect(validarFechaPago("", "2026-10-26")).toBe("Elige la fecha del próximo pago.");
    });

    it("rechaza hoy y las fechas anteriores, que dejarían el colegio bloqueado", () => {
        const mensaje = "La fecha debe ser posterior a hoy; si no, el colegio seguirá bloqueado.";
        expect(validarFechaPago("2026-10-26", "2026-10-26")).toBe(mensaje);
        expect(validarFechaPago("2026-09-30", "2026-10-26")).toBe(mensaje);
    });

    it("acepta una fecha posterior a hoy", () => {
        expect(validarFechaPago("2026-10-27", "2026-10-26")).toBe("");
    });
});

describe("construirPayloadPago", () => {
    it("arma el cuerpo que acepta POST /super-admin/tenants/{id}/pagos", () => {
        expect(construirPayloadPago("2026-11-26", "  Transferencia  ")).toEqual({
            fecha_proximo_pago: "2026-11-26",
            nota: "Transferencia",
        });
        expect(construirPayloadPago("2026-11-26", undefined)).toEqual({
            fecha_proximo_pago: "2026-11-26",
            nota: "",
        });
    });
});

describe("textoPagoRegistrado", () => {
    it("confirma que el colegio quedó activo", () => {
        expect(
            textoPagoRegistrado({
                nombre: "Colegio Uno",
                estado: "activo",
                fecha_proximo_pago: "2026-11-26",
            }),
        ).toBe("Colegio Uno quedó activo. Próximo pago: 2026-11-26.");
    });

    it("explica que el estado manual lo sigue bloqueando", () => {
        expect(
            textoPagoRegistrado({
                nombre: "Colegio Tres",
                estado: "suspendido",
                fecha_proximo_pago: "2026-11-26",
            }),
        ).toBe(
            "Próximo pago: 2026-11-26. Colegio Tres sigue en suspendido por su estado manual: cámbialo a activo en la columna Cambiar.",
        );
    });
});

describe("mensajeErrorPago", () => {
    it("muestra el detalle del backend cuando es texto", () => {
        expect(
            mensajeErrorPago({
                response: { data: { detail: "El colegio no tiene suscripcion registrada" } },
            }),
        ).toBe("El colegio no tiene suscripcion registrada");
    });

    it("usa el mensaje propio cuando no hay detalle legible", () => {
        expect(mensajeErrorPago({ response: { data: { detail: [{ loc: [] }] } } })).toBe(
            "No se pudo registrar el pago. Intenta nuevamente.",
        );
        expect(mensajeErrorPago(new Error("red"))).toBe(
            "No se pudo registrar el pago. Intenta nuevamente.",
        );
    });
});

describe("htmlFormularioPago", () => {
    it("pinta la fecha vigente, la sugerida y los campos que lee el comando", () => {
        const html = htmlFormularioPago({ fecha_proximo_pago: "2026-07-01" }, "2026-11-26");

        expect(html).toContain("<strong>2026-07-01</strong>");
        expect(html).toMatch(/id="pago-fecha-proximo"[^>]*value="2026-11-26"/);
        expect(html).toContain('id="pago-nota"');
    });

    it("usa el respaldo sin fecha y escapa lo que pinta", () => {
        expect(htmlFormularioPago({ fecha_proximo_pago: null }, "2026-11-26")).toContain(
            "<strong>Sin fecha</strong>",
        );
        expect(
            htmlFormularioPago({ fecha_proximo_pago: "<b>x</b>" }, '"><script>'),
        ).not.toContain("<script>");
    });
});
