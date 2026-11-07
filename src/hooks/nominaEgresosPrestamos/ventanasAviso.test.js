import { describe, expect, it, vi } from "vitest";
import Swal from "sweetalert2";
import { avisarExitoYEsperarCierre, TEXTO_CON_SALTOS } from "./ventanasAviso";
import { TIEMPO_PARA_LEER } from "../ventanaExito";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("ventanasAviso", () => {
    it("abre la ventana de éxito común respetando los saltos de línea del texto", () => {
        avisarExitoYEsperarCierre({ title: "Listo", text: "Uno\nDos" });

        expect(Swal.fire).toHaveBeenCalledWith(
            expect.objectContaining({
                icon: "success",
                title: "Listo",
                text: "Uno\nDos",
                // Se cierra sola, como todas las de éxito.
                timer: TIEMPO_PARA_LEER,
                showConfirmButton: false,
                customClass: expect.objectContaining({
                    popup: "ventana-exito",
                    ...TEXTO_CON_SALTOS,
                }),
            })
        );
        expect(TEXTO_CON_SALTOS).toEqual({ htmlContainer: "whitespace-pre-line" });
    });

    it("cumple la promesa solo cuando la ventana terminó de cerrarse", async () => {
        let cerrada = false;
        const promesa = avisarExitoYEsperarCierre({ title: "Listo" }).then(() => {
            cerrada = true;
        });

        await Promise.resolve();
        expect(cerrada).toBe(false);

        Swal.fire.mock.calls.at(-1)[0].didClose();
        await promesa;

        expect(cerrada).toBe(true);
    });
});
