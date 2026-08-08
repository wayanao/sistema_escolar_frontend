import { describe, expect, it } from "vitest";
import {
  MEDIOS_PAGO_INGRESO,
  montoIngresoPorMedio,
  montoVisibleIngreso,
  montoVisibleMetodoPago,
  obtenerMediosPago,
} from "./mediosPago";

// Estas pruebas caracterizan el comportamiento vigente de mediosPago.js
// antes de cualquier extracción. Reflejan tanto el contrato real que produce
// hoy `sistema_escolar_api` (`app/controllers/reportes_controller.py`,
// campo `tipo_pago` como texto plano, unido con " + " para métodos
// combinados y con " - nota" cuando existe nota) como variantes históricas
// que el archivo sigue tolerando.

describe("MEDIOS_PAGO_INGRESO", () => {
  it("expone las opciones de filtro en el orden y textos actuales", () => {
    expect(MEDIOS_PAGO_INGRESO).toEqual([
      { value: "todos", label: "Todos" },
      { value: "efectivo", label: "Efectivo" },
      { value: "transferencia", label: "Transferencia" },
      { value: "tarjeta", label: "Tarjeta" },
      { value: "subsidio", label: "Subsidio" },
    ]);
  });
});

describe("obtenerMediosPago — contrato real de /reportes/ingresos-*", () => {
  it("reconoce un único medio simple en tipo_pago", () => {
    const pago = { tipo_pago: "Efectivo" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "efectivo", tipo: "Efectivo", monto: null },
    ]);
  });

  it("separa métodos combinados unidos con ' + '", () => {
    const pago = { tipo_pago: "Efectivo + Tarjeta" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "efectivo", tipo: "Efectivo", monto: null },
      { key: "tarjeta", tipo: "Tarjeta", monto: null },
    ]);
  });

  it("conserva la nota libre de un método con formato 'Tipo - nota'", () => {
    const pago = { tipo_pago: "Transferencia - PSE123" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "transferencia", tipo: "Transferencia - PSE123", monto: null },
    ]);
  });

  it("conserva la nota dentro de un método combinado", () => {
    const pago = { tipo_pago: "Efectivo + Transferencia - PSE123" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "efectivo", tipo: "Efectivo", monto: null },
      { key: "transferencia", tipo: "Transferencia - PSE123", monto: null },
    ]);
  });

  it("reconoce subsidio con nota libre", () => {
    const pago = { tipo_pago: "Subsidio - Alcaldía municipal" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "subsidio", tipo: "Subsidio - Alcaldía municipal", monto: null },
    ]);
  });

  it("clasifica un valor sin coincidencia conocida como 'No especificado'", () => {
    const pago = { tipo_pago: "" };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "", tipo: "No especificado", monto: null },
    ]);
  });

  it("cuando no hay ningún campo de medio de pago, devuelve 'No especificado'", () => {
    expect(obtenerMediosPago({})).toEqual([
      { key: "", tipo: "No especificado", monto: null },
    ]);
  });
});

describe("obtenerMediosPago — alias y sinónimos", () => {
  it.each([
    ["PSE", "transferencia", "PSE"],
    ["Nequi", "transferencia", "Nequi"],
    ["Daviplata", "transferencia", "Daviplata"],
    ["Bancolombia", "transferencia", "Bancolombia"],
    ["Datafono", "tarjeta", "Datáfono"],
    ["Tarjeta crédito", "tarjeta", "Tarjeta crédito"],
    ["Tarjeta débito", "tarjeta", "Tarjeta débito"],
    ["targeta", "tarjeta", "Tarjeta"],
    ["cash", "efectivo", "Efectivo"],
    ["pos", "tarjeta", "POS"],
  ])("interpreta %s como %s con etiqueta %s", (valor, keyEsperada, etiquetaEsperada) => {
    const [medio] = obtenerMediosPago({ tipo_pago: valor });
    expect(medio.key).toBe(keyEsperada);
    expect(medio.tipo).toBe(etiquetaEsperada);
  });
});

describe("obtenerMediosPago — variantes históricas de campos", () => {
  it("usa metodo_pago cuando no hay tipo_pago", () => {
    expect(obtenerMediosPago({ metodo_pago: "Efectivo" })[0].key).toBe("efectivo");
  });

  it("usa forma_pago cuando no hay tipo_pago ni metodo_pago", () => {
    expect(obtenerMediosPago({ forma_pago: "Tarjeta" })[0].key).toBe("tarjeta");
  });

  it("usa medio_pago cuando es el único campo presente", () => {
    expect(obtenerMediosPago({ medio_pago: "Subsidio" })[0].key).toBe("subsidio");
  });

  it("prioriza tipo_pago sobre las demás variantes cuando coexisten", () => {
    const pago = {
      tipo_pago: "Efectivo",
      metodo_pago: "Tarjeta",
      medio_pago: "Subsidio",
    };
    expect(obtenerMediosPago(pago)[0].key).toBe("efectivo");
  });

  it("normaliza un arreglo de métodos en el campo metodos", () => {
    const pago = {
      metodos: [
        { tipo: "Efectivo", monto: 5000 },
        { tipo: "Tarjeta", monto: 3000 },
      ],
    };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "efectivo", tipo: "Efectivo", monto: 5000 },
      { key: "tarjeta", tipo: "Tarjeta", monto: 3000 },
    ]);
  });

  it("normaliza un arreglo de métodos serializado como JSON en metodos_pago", () => {
    const pago = {
      metodos_pago: JSON.stringify([{ tipo: "transferencia", monto: 2000 }]),
    };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "transferencia", tipo: "Transferencia", monto: 2000 },
    ]);
  });

  it("normaliza un mapa de objeto en medios_pago", () => {
    const pago = { medios_pago: { efectivo: 1000, tarjeta: 2000 } };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "efectivo", tipo: "Efectivo", monto: 1000 },
      { key: "tarjeta", tipo: "Tarjeta", monto: 2000 },
    ]);
  });

  it("usa el campo referencia como detalle cuando el método es un objeto único", () => {
    const pago = { detalle_metodos: { tipo: "transferencia", referencia: "TRX-1" } };
    expect(obtenerMediosPago(pago)).toEqual([
      { key: "transferencia", tipo: "Transferencia - TRX-1", monto: null },
    ]);
  });
});

describe("montoIngresoPorMedio", () => {
  it("con filtro 'todos' devuelve el monto válido total (monto_valido)", () => {
    const pago = { monto: 50000, monto_valido: 45000 };
    expect(montoIngresoPorMedio(pago, "todos")).toBe(45000);
  });

  it("con filtro 'todos' usa el monto normal si no hay monto_valido", () => {
    const pago = { monto: 50000 };
    expect(montoIngresoPorMedio(pago, "todos")).toBe(50000);
  });

  it("un pago anulado siempre devuelve 0, sin importar el filtro", () => {
    const pago = { monto: 50000, tipo_pago: "Efectivo", anulado: true };
    expect(montoIngresoPorMedio(pago, "efectivo")).toBe(0);
    expect(montoIngresoPorMedio(pago, "todos")).toBe(0);
  });

  it("devuelve 0 cuando el medio filtrado no aparece en el pago", () => {
    const pago = { monto: 50000, tipo_pago: "Efectivo" };
    expect(montoIngresoPorMedio(pago, "tarjeta")).toBe(0);
  });

  it("suma los montos positivos de un método combinado con montos propios", () => {
    const pago = {
      metodos: [
        { tipo: "Efectivo", monto: 5000 },
        { tipo: "Tarjeta", monto: 3000 },
      ],
    };
    expect(montoIngresoPorMedio(pago, "tarjeta")).toBe(3000);
  });

  it("con contrato real: un método combinado SIN montos por método cae al total del pago", () => {
    // Riesgo caracterizado: el backend actual no envía monto por método en
    // /reportes/ingresos-rango ni /reportes/ingresos-mes; solo une el texto
    // con " + " en tipo_pago. Al no encontrar montos positivos por medio,
    // la función conserva el comportamiento vigente de devolver el monto
    // total del pago para CUALQUIER medio que forme parte de la combinación.
    const pago = { monto: 80000, tipo_pago: "Efectivo + Tarjeta" };
    expect(montoIngresoPorMedio(pago, "efectivo")).toBe(80000);
    expect(montoIngresoPorMedio(pago, "tarjeta")).toBe(80000);
  });
});

describe("montoVisibleIngreso", () => {
  it("con filtro 'todos' devuelve el monto total sin importar anulación", () => {
    const pago = { monto: 50000, anulado: true };
    expect(montoVisibleIngreso(pago, "todos")).toBe(50000);
  });

  it("suma los montos positivos del medio filtrado cuando existen", () => {
    const pago = {
      metodos: [
        { tipo: "Efectivo", monto: 5000 },
        { tipo: "Tarjeta", monto: 3000 },
      ],
    };
    expect(montoVisibleIngreso(pago, "efectivo")).toBe(5000);
  });

  it("con contrato real: un método combinado sin montos cae al total del pago", () => {
    const pago = { monto: 80000, tipo_pago: "Efectivo + Tarjeta" };
    expect(montoVisibleIngreso(pago, "tarjeta")).toBe(80000);
  });

  it("devuelve 0 cuando el medio filtrado no aparece en el pago", () => {
    const pago = { monto: 80000, tipo_pago: "Efectivo" };
    expect(montoVisibleIngreso(pago, "subsidio")).toBe(0);
  });
});

describe("montoVisibleMetodoPago", () => {
  it("devuelve el monto propio del método cuando es positivo", () => {
    const medio = { key: "efectivo", tipo: "Efectivo", monto: 5000 };
    expect(montoVisibleMetodoPago({}, medio, "todos")).toBe(5000);
  });

  it("sin monto propio, si el método coincide con el filtro activo, delega en montoVisibleIngreso", () => {
    const pago = { monto: 80000, tipo_pago: "Efectivo + Tarjeta" };
    const medio = { key: "tarjeta", tipo: "Tarjeta", monto: null };
    expect(montoVisibleMetodoPago(pago, medio, "tarjeta")).toBe(80000);
  });

  it("sin monto propio y sin coincidir con el filtro activo, devuelve null", () => {
    const pago = { monto: 80000, tipo_pago: "Efectivo + Tarjeta" };
    const medio = { key: "tarjeta", tipo: "Tarjeta", monto: null };
    expect(montoVisibleMetodoPago(pago, medio, "todos")).toBeNull();
  });
});

describe("numeroDesdeValor — parseo de montos con formato regional (vía funciones exportadas)", () => {
  it("interpreta un separador de miles con punto (formato colombiano)", () => {
    const pago = { metodos: [{ tipo: "Efectivo", monto: "150.000" }] };
    expect(obtenerMediosPago(pago)[0].monto).toBe(150000);
  });

  it("interpreta un decimal con coma cuando el punto es separador de miles", () => {
    const pago = { metodos: [{ tipo: "Efectivo", monto: "1.500,50" }] };
    expect(obtenerMediosPago(pago)[0].monto).toBe(1500.5);
  });

  it("interpreta un decimal con punto cuando la coma es separador de miles", () => {
    const pago = { metodos: [{ tipo: "Efectivo", monto: "1,500.50" }] };
    expect(obtenerMediosPago(pago)[0].monto).toBe(1500.5);
  });
});
