export const MEDIOS_PAGO_INGRESO = [
  { value: "todos", label: "Todos" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "subsidio", label: "Subsidio" },
];

const textoMedioPago = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]/g, " ")
    .trim()
    .toLowerCase();

const detectarKeysMedioPago = (valor) => {
  const original = String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const prefijos = [
    ["subsidio", ["subsidio", "subsidy"]],
    ["efectivo", ["efectivo", "cash"]],
    ["transferencia", ["transferencia bancaria", "transferencia", "transfer", "pse"]],
    ["tarjeta", ["tarjeta credito", "tarjeta debito", "tarjeta", "targeta", "datafono", "pos"]],
  ];

  for (const [key, alias] of prefijos) {
    if (
      alias.some(
        (nombre) =>
          original === nombre ||
          original.startsWith(`${nombre} -`) ||
          original.startsWith(`${nombre}:`)
      )
    ) {
      return [key];
    }
  }

  const texto = textoMedioPago(valor);
  if (!texto) return [];

  const keys = [];
  if (texto.includes("efectivo") || texto.includes("cash")) keys.push("efectivo");
  if (
    texto.includes("transfer") ||
    texto.includes("pse") ||
    texto.includes("nequi") ||
    texto.includes("daviplata") ||
    texto.includes("bancolombia") ||
    texto.includes("banco")
  ) {
    keys.push("transferencia");
  }
  if (
    texto.includes("tarjeta") ||
    texto.includes("targeta") ||
    texto.includes("card") ||
    texto.includes("credito") ||
    texto.includes("debito") ||
    texto.includes("datafono") ||
    texto.includes("pos")
  ) {
    keys.push("tarjeta");
  }
  if (texto.includes("subsidio") || texto.includes("subsidy")) {
    keys.push("subsidio");
  }

  return Array.from(new Set(keys));
};

const keyMedioPago = (valor) => {
  const keys = detectarKeysMedioPago(valor);
  if (keys.length) return keys[0];
  const texto = textoMedioPago(valor);
  if (texto === "targeta") return "tarjeta";
  return texto;
};

const normalizarMedioPago = (valor) => {
  const key = keyMedioPago(valor);
  const nombres = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    tarjeta: "Tarjeta",
    subsidio: "Subsidio",
  };
  return nombres[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : "No especificado");
};

const capitalizarTexto = (valor) =>
  String(valor || "")
    .replace(/[_-]/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());

const textoLibreDetalle = (valor) => String(valor ?? "").trim();

const textoComparacionConSeparadores = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const limpiarSeparadorInicial = (valor) => {
  let limpio = textoLibreDetalle(valor);
  while (limpio.startsWith("-") || limpio.startsWith(":")) {
    limpio = limpio.slice(1).trim();
  }
  return limpio;
};

const extraerDetalleDesdeValorMetodo = (valor, key) => {
  const original = textoLibreDetalle(valor);
  if (!original || !key) return "";

  const texto = textoComparacionConSeparadores(original);
  const aliasPorKey = {
    efectivo: ["efectivo", "cash"],
    transferencia: ["transferencia bancaria", "transferencia", "transfer", "pse"],
    tarjeta: ["tarjeta credito", "tarjeta debito", "tarjeta", "targeta", "datafono", "pos"],
    subsidio: ["subsidio", "subsidy"],
  };

  for (const alias of aliasPorKey[key] || []) {
    if (texto === alias) return "";
    if (texto.startsWith(`${alias} -`) || texto.startsWith(`${alias}:`)) {
      return limpiarSeparadorInicial(original.slice(alias.length));
    }
  }

  return "";
};

const etiquetaVisibleMedioPago = (valor, keyFallback = "") => {
  const texto = textoMedioPago(valor);
  if (!texto) return normalizarMedioPago(keyFallback);

  if (texto === "pse") return "PSE";
  if (texto === "pos") return "POS";
  if (texto.includes("nequi")) return "Nequi";
  if (texto.includes("daviplata")) return "Daviplata";
  if (texto.includes("bancolombia")) return "Bancolombia";
  if (texto.includes("datafono")) return "Datáfono";

  if (texto.includes("tarjeta") || texto.includes("targeta")) {
    if (texto.includes("credito")) return "Tarjeta crédito";
    if (texto.includes("debito")) return "Tarjeta débito";
    return "Tarjeta";
  }

  if (texto.includes("transfer")) {
    return texto.includes("bancaria") ? "Transferencia bancaria" : "Transferencia";
  }

  if (texto.includes("efectivo") || texto.includes("cash")) return "Efectivo";
  if (texto.includes("subsidio") || texto.includes("subsidy")) return "Subsidio";
  return capitalizarTexto(valor);
};

const obtenerValorMetodoPago = (metodo) => {
  if (typeof metodo === "string") return metodo;
  if (!metodo || typeof metodo !== "object") return "";

  return (
    metodo.tipo ||
    metodo.metodo ||
    metodo.forma_pago ||
    metodo.tipo_pago ||
    metodo.medio_pago ||
    metodo.metodo_pago ||
    metodo.nombre ||
    metodo.label ||
    metodo.value ||
    ""
  );
};

const obtenerDetalleMetodoPago = (metodo) => {
  if (!metodo || typeof metodo !== "object") return "";

  return (
    metodo.nota ||
    metodo.nota_pago ||
    metodo.nota_metodo ||
    metodo.observacion ||
    metodo.observaciones ||
    metodo.referencia ||
    metodo.detalle ||
    metodo.detalle_pago ||
    metodo.descripcion_metodo ||
    metodo.banco ||
    metodo.entidad ||
    metodo.entidad_bancaria ||
    metodo.banco_transferencia ||
    metodo.canal ||
    metodo.app ||
    metodo.plataforma ||
    metodo.proveedor ||
    (metodo.tipo && metodo.nombre ? metodo.nombre : "") ||
    ""
  );
};

const nombreVisibleMetodoPago = (metodo, key) => {
  const valor = obtenerValorMetodoPago(metodo);
  const detalle = obtenerDetalleMetodoPago(metodo) || extraerDetalleDesdeValorMetodo(valor, key);
  const etiqueta = detalle && key ? normalizarMedioPago(key) : etiquetaVisibleMedioPago(valor, key);
  const etiquetaDetalle = textoLibreDetalle(detalle);

  if (detalle && textoMedioPago(detalle) !== textoMedioPago(valor)) {
    return etiqueta && etiqueta !== "No especificado" ? `${etiqueta} - ${etiquetaDetalle}` : etiquetaDetalle;
  }

  return etiqueta;
};

const numeroDesdeValor = (valor) => {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor === "object") return obtenerMontoMetodoPago(valor);

  const limpio = String(valor).replace(/[^\d,.-]/g, "");
  if (!limpio) return null;

  const tieneComa = limpio.includes(",");
  const tienePunto = limpio.includes(".");
  let normalizado = limpio;

  if (tieneComa && tienePunto) {
    normalizado =
      limpio.lastIndexOf(",") > limpio.lastIndexOf(".")
        ? limpio.replace(/\./g, "").replace(",", ".")
        : limpio.replace(/,/g, "");
  } else if (tienePunto) {
    const partes = limpio.split(".");
    normalizado = partes.length > 1 && partes.at(-1)?.length === 3 ? partes.join("") : limpio;
  } else if (tieneComa) {
    const partes = limpio.split(",");
    normalizado = partes.length > 1 && partes.at(-1)?.length === 3 ? partes.join("") : limpio.replace(",", ".");
  }

  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
};

const obtenerMontoMetodoPago = (metodo) => {
  if (!metodo || typeof metodo !== "object") return null;
  const valores = [
    metodo.monto,
    metodo.valor,
    metodo.total,
    metodo.importe,
    metodo.amount,
    metodo.cantidad,
    metodo.monto_pago,
    metodo.valor_pago,
    metodo.monto_pagado,
    metodo.valor_pagado,
    metodo.pagado,
    metodo.abono,
    metodo.valor_abono,
    metodo.monto_abono,
    metodo.subtotal,
    metodo.value_amount,
  ];

  for (const valor of valores) {
    const numero = numeroDesdeValor(valor);
    if (numero !== null) return numero;
  }

  return null;
};

const obtenerMontoPagoPorCampo = (pago, key) => {
  if (!pago || typeof pago !== "object") return null;

  const camposPorKey = {
    efectivo: ["monto_efectivo", "valor_efectivo", "efectivo", "cash"],
    transferencia: [
      "monto_transferencia",
      "valor_transferencia",
      "monto_transferencia_bancaria",
      "valor_transferencia_bancaria",
      "transferencia",
      "monto_transferido",
      "valor_transferido",
      "monto_transaccion",
      "valor_transaccion",
      "monto_pse",
      "valor_pse",
      "pse",
      "monto_nequi",
      "valor_nequi",
      "nequi",
      "monto_daviplata",
      "valor_daviplata",
      "daviplata",
    ],
    tarjeta: [
      "monto_tarjeta",
      "valor_tarjeta",
      "tarjeta",
      "monto_tarjeta_credito",
      "valor_tarjeta_credito",
      "tarjeta_credito",
      "monto_tarjeta_debito",
      "valor_tarjeta_debito",
      "tarjeta_debito",
      "monto_datafono",
      "valor_datafono",
      "datafono",
      "pos",
    ],
    subsidio: [
      "monto_subsidio",
      "valor_subsidio",
      "subsidio",
      "monto_aporte",
      "valor_aporte",
    ],
  };

  for (const campo of camposPorKey[key] || []) {
    const numero = numeroDesdeValor(pago[campo]);
    if (numero !== null) return numero;
  }

  return null;
};

const montoTotalIngreso = (pago) => {
  const campos = [
    pago?.monto,
    pago?.valor,
    pago?.total,
    pago?.importe,
    pago?.monto_pagado,
    pago?.valor_pagado,
    pago?.pagado,
    pago?.abono,
    pago?.monto_abono,
    pago?.valor_abono,
    pago?.monto_valido,
  ];

  for (const valor of campos) {
    const numero = numeroDesdeValor(valor);
    if (numero !== null) return numero;
  }

  return 0;
};

const montosPositivos = (medios) =>
  medios
    .map((medio) => numeroDesdeValor(medio.monto))
    .filter((monto) => monto !== null && monto > 0);

const normalizarListaMetodos = (valor) => {
  if (Array.isArray(valor)) return valor;

  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return normalizarListaMetodos(parsed);
    } catch {
      return null;
    }
  }

  if (valor && typeof valor === "object") {
    if (obtenerValorMetodoPago(valor)) {
      return [valor];
    }

    return Object.entries(valor).map(([tipo, datos]) =>
      datos && typeof datos === "object" ? { tipo, ...datos } : { tipo, monto: datos }
    );
  }

  return null;
};

export const obtenerMediosPago = (pago) => {
  const listaMetodos = [
    pago.metodos,
    pago.metodos_pago,
    pago.medios_pago,
    pago.formas_pago,
    pago.detalle_metodos,
  ].map(normalizarListaMetodos).find(Array.isArray);

  if (listaMetodos?.length) {
    return listaMetodos.map((metodo) => {
      const key = keyMedioPago(obtenerValorMetodoPago(metodo));
      return {
        key,
        tipo: nombreVisibleMetodoPago(metodo, key),
        monto: obtenerMontoMetodoPago(metodo) ?? obtenerMontoPagoPorCampo(pago, key),
      };
    });
  }

  const valorMedio = [
    pago.tipo_pago,
    pago.metodo_pago,
    pago.medio_pago,
    pago.forma_pago,
    pago.metodo,
    typeof pago.metodos === "string" ? pago.metodos : "",
    typeof pago.metodos_pago === "string" ? pago.metodos_pago : "",
    typeof pago.medios_pago === "string" ? pago.medios_pago : "",
    typeof pago.formas_pago === "string" ? pago.formas_pago : "",
    typeof pago.detalle_metodos === "string" ? pago.detalle_metodos : "",
  ].find((valor) => String(valor || "").trim());
  const segmentosMedio = String(valorMedio || "")
    .split(/\s*\+\s*/)
    .map((segmento) => segmento.trim())
    .filter(Boolean);

  if (segmentosMedio.length > 1) {
    return segmentosMedio.map((segmento) => {
      const key = keyMedioPago(segmento);
      return {
        key,
        tipo: nombreVisibleMetodoPago(segmento, key),
        monto: obtenerMontoPagoPorCampo(pago, key),
      };
    });
  }

  const keysDetectadas = detectarKeysMedioPago(valorMedio);
  if (keysDetectadas.length > 1) {
    return keysDetectadas.map((key) => ({
      key,
      tipo: normalizarMedioPago(key),
      monto: obtenerMontoPagoPorCampo(pago, key),
    }));
  }

  const key = keyMedioPago(valorMedio);
  const metodoDesdePago = {
    tipo: valorMedio,
    nota: pago.nota,
    nota_pago: pago.nota_pago,
    nota_metodo: pago.nota_metodo,
    observacion: pago.observacion,
    observaciones: pago.observaciones,
    referencia: pago.referencia,
    detalle: pago.detalle,
    detalle_pago: pago.detalle_pago,
    descripcion_metodo: pago.descripcion_metodo,
    banco: pago.banco,
    entidad: pago.entidad,
    entidad_bancaria: pago.entidad_bancaria,
    banco_transferencia: pago.banco_transferencia,
    canal: pago.canal,
    app: pago.app,
    plataforma: pago.plataforma,
    proveedor: pago.proveedor,
  };

  return [
    {
      key,
      tipo: nombreVisibleMetodoPago(metodoDesdePago, key),
      monto: obtenerMontoPagoPorCampo(pago, key),
    },
  ];
};

const montoValidoIngreso = (pago) => {
  if (pago?.anulado) return 0;
  const montoValido = numeroDesdeValor(pago?.monto_valido);
  return montoValido ?? montoTotalIngreso(pago);
};

export const montoIngresoPorMedio = (pago, medioFiltro) => {
  if (medioFiltro === "todos") return montoValidoIngreso(pago);
  if (pago?.anulado) return 0;

  const medios = obtenerMediosPago(pago).filter((medio) => medio.key === medioFiltro);
  if (!medios.length) return 0;

  const montosPorMedio = montosPositivos(medios);

  if (montosPorMedio.length) {
    return montosPorMedio.reduce((total, monto) => total + monto, 0);
  }

  return montoValidoIngreso(pago);
};

export const montoVisibleIngreso = (pago, medioFiltro) => {
  if (medioFiltro === "todos") return montoTotalIngreso(pago);

  const medios = obtenerMediosPago(pago).filter((medio) => medio.key === medioFiltro);
  const montosPorMedio = montosPositivos(medios);

  if (montosPorMedio.length) {
    return montosPorMedio.reduce((total, monto) => total + monto, 0);
  }

  return medios.length ? montoTotalIngreso(pago) : 0;
};

export const montoVisibleMetodoPago = (pago, medio, filtroMedioIngreso) => {
  const monto = numeroDesdeValor(medio.monto);
  if (monto !== null && monto > 0) return monto;
  if (filtroMedioIngreso !== "todos" && medio.key === filtroMedioIngreso) {
    return montoVisibleIngreso(pago, filtroMedioIngreso);
  }
  return null;
};
