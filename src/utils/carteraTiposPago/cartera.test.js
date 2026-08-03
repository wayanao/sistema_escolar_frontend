import { describe, expect, it } from "vitest";
import {
    calcularTotalesCartera,
    calcularTotalesCarteraVisible,
    construirCsvCartera,
    filtrarCartera,
    obtenerCursosUnicos,
    obtenerMaxDeuda,
} from "./cartera";

const items = [
    {
        estudiante_id: 1,
        nombre: "Ana",
        apellido: "Pérez",
        curso_id: 10,
        curso_nombre: "5A",
        deuda_academica: 100000,
        deuda_inventario: 0,
        mora: 10000,
        total: 110000,
        cuotas_vencidas: 1,
    },
    {
        estudiante_id: 2,
        nombre: "Luis",
        apellido: "Gómez",
        curso_id: 20,
        curso_nombre: "6B",
        deuda_academica: 0,
        deuda_inventario: 200000,
        mora: 0,
        total: 200000,
        cuotas_vencidas: 2,
    },
];

describe("utilidades puras de cartera", () => {
    it("normaliza los campos del total usado por los estados de cuenta", () => {
        expect(
            calcularTotalesCartera([
                {
                    total: "10",
                    deuda_academica: "3",
                    deuda_inventario: "4",
                    mora: "2",
                    cuotas_vencidas: "1",
                },
            ])
        ).toEqual({ total: 10, academica: 3, inventario: 4, mora: 2, cuotas: 1 });
    });

    it("conserva los totales visibles de la tabla", () => {
        expect(calcularTotalesCarteraVisible(items)).toEqual({
            total: 310000,
            academica: 100000,
            inventario: 200000,
            mora: 10000,
        });
    });

    it("obtiene cursos únicos y conserva su orden de aparición", () => {
        expect(
            obtenerCursosUnicos([
                ...items,
                { curso_id: 10, curso_nombre: "Quinto A" },
            ])
        ).toEqual([
            { id: 10, nombre: "Quinto A" },
            { id: 20, nombre: "6B" },
        ]);
    });

    it("combina curso, tipo de deuda y búsqueda de texto", () => {
        expect(
            filtrarCartera(items, {
                busqueda: "PÉREZ 5A",
                filtroCurso: "10",
                filtroTipo: "mora",
            })
        ).toEqual([items[0]]);
        expect(
            filtrarCartera(items, {
                busqueda: "",
                filtroCurso: "",
                filtroTipo: "inventario",
            })
        ).toEqual([items[1]]);
    });

    it("mantiene un denominador mínimo de uno para el indicador de deuda", () => {
        expect(obtenerMaxDeuda([])).toBe(1);
        expect(obtenerMaxDeuda(items)).toBe(200000);
    });

    it("construye el contenido CSV con el contrato actual", () => {
        expect(construirCsvCartera([items[0]])).toBe(
            [
                "Estudiante,Curso,Deuda Académica,Deuda Inventario,Mora,Total,Cuotas Vencidas",
                '"Pérez Ana","5A",100000,0,10000,110000,1',
            ].join("\n")
        );
    });
});
