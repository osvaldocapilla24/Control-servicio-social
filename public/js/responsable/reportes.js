//funciones de reportes
function filtrarRegistrosPorMes(registros, mes) {
  return registros.filter((registro) => {
    return String(registro.fecha || "").startsWith(mes);
  });
}

function calcularHorasDeRegistros(registros) {
  return registros.reduce((total, registro) => {
    return total + Number(registro.horas || 0);
  }, 0);
}

function obtenerNombreMes(mes) {
  const [anio, numeroMes] = mes.split("-");
  const fecha = new Date(Number(anio), Number(numeroMes) - 1, 1);

  return fecha.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });
}

function calcularTotalesExportacion(resumen) {
  return {
    horasAcumuladas: Number(resumen.horas_acumuladas || 0).toFixed(2),
    horasFaltantes: Number(resumen.horas_faltantes || 0).toFixed(2),
    horasRequeridas: Number(resumen.horas_requeridas || 0).toFixed(2),
  };
}

function exportarReporteGeneralExcelDesdeDatos(datos, titulo, nombreArchivo) {
  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería para generar Excel.");
    return;
  }

  const datosExcel = [
    ["BUAP"],
    ["Facultad de Administración"],
    [`Periodo de servicio social: ${obtenerTextoPeriodoSeleccionado()}`],
    [titulo],
    [],
    [
      "Nombre",
      "Matrícula",
      "Carrera",
      "Horario",
      "Horas del periodo",
      "Horas acumuladas",
      "Horas faltantes",
      "Estatus",
    ],
  ];

  datos.forEach((p) => {
    datosExcel.push([
      p.nombre || "",
      p.matricula || "",
      p.carrera || "",
      p.horario || "",
      Number(p.horas_mes ?? p.horas_acumuladas ?? 0),
      Number(p.horas_acumuladas || 0),
      Number(p.horas_faltantes || 0),
      p.estatus || "activo",
    ]);
  });

  const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

  hoja["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 38 },
    { wch: 36 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
  ];

  hoja["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } },
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Reporte general");

  XLSX.writeFile(libro, nombreArchivo);
}

async function exportarReporteGeneralCompletoExcel() {
  const reporte = await obtenerReporteGeneralCompleto();

  if (!reporte) {
    return;
  }

  exportarReporteGeneralExcelDesdeDatos(
    reporte.datos,
    "Reporte general completo",
    "reporte_general_completo.xlsx",
  );
}

async function exportarReporteGeneralExcel() {
  const reporte = await obtenerReporteMensualGeneral();
  

  if (!reporte) {
    return;
  }

  exportarReporteGeneralExcelDesdeDatos(
    reporte.datos,
    `Reporte mensual general - ${reporte.nombreMes}`,
    `reporte_mensual_general_${reporte.mes}.xlsx`,
  );
}

async function exportarReporteGeneralPDF() {
  const reporte = await obtenerReporteMensualGeneral();

  if (!reporte) {
    return;
  }

  exportarReporteGeneralPDFDesdeDatos(
    reporte.datos,
    "Reporte mensual general",
    reporte.nombreMes,
  );
}

function exportarReporteGeneralPDFDesdeDatos(datos, titulo, subtitulo) {
  const filas = datos
    .map(
      (p) => `
    <tr>
      <td>${p.nombre || ""}</td>
      <td>${p.matricula || ""}</td>
      <td>${p.carrera || ""}</td>
      <td>${p.horario || ""}</td>
      <td>${Number(p.horas_mes ?? p.horas_acumuladas ?? 0).toFixed(2)}</td>
      <td>${Number(p.horas_acumuladas || 0).toFixed(2)}</td>
      <td>${Number(p.horas_faltantes || 0).toFixed(2)}</td>
      <td>${p.estatus || "activo"}</td>
    </tr>
  `,
    )
    .join("");

  const ventana = window.open("", "_blank");

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${titulo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 28px;
          color: #1f2937;
        }

        .encabezado {
          text-align: center;
          margin-bottom: 22px;
        }

        .logo {
          font-weight: 800;
          color: #1e3a8a;
          font-size: 22px;
          margin-bottom: 4px;
        }

        .facultad {
          font-weight: 700;
          color: #1e3a8a;
          font-size: 14px;
          margin-bottom: 8px;
        }

        h1 {
          color: #0f2f6e;
          margin: 0;
          font-size: 24px;
        }

        .subtitulo {
          color: #4b5563;
          margin-top: 8px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
          font-size: 10px;
        }

        th {
          background: #1f3f93;
          color: white;
          padding: 7px;
          border: 1px solid #1f3f93;
          text-align: left;
        }

        td {
          padding: 6px;
          border: 1px solid #dbe5f1;
        }

        .nota {
          margin-top: 18px;
          font-size: 11px;
          color: #4b5563;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="encabezado">
        <div class="logo">BUAP</div>
        <div class="facultad">Facultad de Administración</div>
        <h1>${titulo}</h1>
        <p class="subtitulo">
         <strong>Periodo de servicio social:</strong> ${obtenerTextoPeriodoSeleccionado()}
        </p>
        <p class="subtitulo">${subtitulo}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Matrícula</th>
            <th>Carrera</th>
            <th>Horario</th>
            <th>Horas periodo</th>
            <th>Acumuladas</th>
            <th>Faltantes</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>

      <p class="nota">
        Documento generado desde el sistema de control de horas de servicio social.
      </p>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);

  ventana.document.close();
}

async function exportarReporteGeneralCompletoPDF() {
  const reporte = await obtenerReporteGeneralCompleto();

  if (!reporte) {
    return;
  }

  exportarReporteGeneralPDFDesdeDatos(
    reporte.datos,
    "Reporte general completo",
    "Todos los prestadores activos y finalizados",
  );
}

async function obtenerReporteMensualGeneral() {
  const mes = mesReporteGeneral.value;

  if (!mes) {
    alert("Selecciona el mes del reporte.");
    return null;
  }

  try {
    const url = periodoSeleccionadoId
      ? `/api/reportes/mensual-general?mes=${mes}&periodo_id=${periodoSeleccionadoId}`
      : `/api/reportes/mensual-general?mes=${mes}`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.mensaje || "Error al obtener el reporte mensual.");
      return null;
    }

    return {
      mes,
      nombreMes: obtenerNombreMes(mes),
      datos: datos.reporte || [],
    };
  } catch (error) {
    alert("Error al conectar con el servidor.");
    return null;
  }
}

function exportarHistorialExcel(
  resumen,
  registros,
  nombrePeriodo = "Reporte completo",
  mostrarHorasPeriodo = false,
) {
  if (!registros || registros.length === 0) {
    alert("Este prestador no tiene registros para exportar.");
    return;
  }

  if (typeof XLSX === "undefined") {
    alert(
      "No se pudo cargar la librería para generar Excel. Revisa tu conexión a internet.",
    );
    return;
  }

  const totales = calcularTotalesExportacion(resumen);
  const horasPeriodo = calcularHorasDeRegistros(registros).toFixed(2);

  const datosExcel = [
    ["BUAP"],
    ["Facultad de Administración"],
    ["Historial de servicio social"],
    [`Periodo de servicio social: ${obtenerTextoPeriodoSeleccionado()}`],
    [nombrePeriodo],
    [],
    ["Prestador", resumen.nombre || ""],
    ["Matrícula", resumen.matricula || ""],
    ["Carrera", resumen.carrera || ""],
    ["Horario", resumen.horario || ""],
    ["Estatus", resumen.estatus || "activo"],
  ];

  if (mostrarHorasPeriodo) {
    datosExcel.push(["Horas del periodo", Number(horasPeriodo)]);
  }

  datosExcel.push(
    ["Horas acumuladas", Number(totales.horasAcumuladas)],
    ["Horas faltantes", Number(totales.horasFaltantes)],
    ["Horas requeridas", Number(totales.horasRequeridas)],
    [],
  );

  const filaEncabezadoTabla = datosExcel.length;

  datosExcel.push(["Fecha", "Entrada", "Salida", "Horas", "Actividad"]);

  registros.forEach((registro) => {
    datosExcel.push([
      registro.fecha || "",
      registro.hora_entrada || "-",
      registro.hora_salida || "-",
      Number(registro.horas || 0),
      registro.actividad || "-",
    ]);
  });

  const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

  const totalFilasFondo = Math.max(datosExcel.length + 10, 70);
  const totalColumnasFondo = 10;

  hoja["!cols"] = [
    { wch: 22 }, // Etiquetas / Fecha
    { wch: 42 }, // Datos / Entrada
    { wch: 18 }, // Salida
    { wch: 12 }, // Horas
    { wch: 78 }, // Actividad
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
  ];

  hoja["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } },
    { s: { r: 4, c: 0 }, e: { r: 4, c: 4 } },
  ];

  hoja["!autofilter"] = {
    ref: `A${filaEncabezadoTabla + 1}:E${datosExcel.length}`,
  };

  hoja["!view"] = {
    showGridLines: false,
  };

  const estiloFondoBlanco = {
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
  };

  const estiloTitulo = {
    font: {
      bold: true,
      sz: 18,
      color: { rgb: "1E3A8A" },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
  };

  const estiloSubtitulo = {
    font: {
      bold: true,
      sz: 13,
      color: { rgb: "1E3A8A" },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
  };

  const estiloTextoCentro = {
    font: {
      sz: 12,
      color: { rgb: "4B5563" },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
  };

  const estiloDatoLabel = {
    font: {
      bold: true,
      color: { rgb: "0F2F6E" },
    },
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
    border: {
      top: { style: "thin", color: { rgb: "222222" } },
      bottom: { style: "thin", color: { rgb: "222222" } },
      left: { style: "thin", color: { rgb: "222222" } },
      right: { style: "thin", color: { rgb: "222222" } },
    },
    alignment: {
      vertical: "center",
      wrapText: true,
    },
  };

  const estiloDatoValor = {
    font: {
      color: { rgb: "1F2937" },
    },
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
    border: {
      top: { style: "thin", color: { rgb: "222222" } },
      bottom: { style: "thin", color: { rgb: "222222" } },
      left: { style: "thin", color: { rgb: "222222" } },
      right: { style: "thin", color: { rgb: "222222" } },
    },
    alignment: {
      horizontal: "left",
      vertical: "center",
      wrapText: true,
    },
  };

  const estiloEncabezadoTabla = {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
    },
    fill: {
      fgColor: { rgb: "1F3F93" },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
    border: {
      top: { style: "thin", color: { rgb: "1F3F93" } },
      bottom: { style: "thin", color: { rgb: "1F3F93" } },
      left: { style: "thin", color: { rgb: "1F3F93" } },
      right: { style: "thin", color: { rgb: "1F3F93" } },
    },
  };

  const estiloCeldaTabla = {
    fill: {
      fgColor: { rgb: "FFFFFF" },
    },
    border: {
      top: { style: "thin", color: { rgb: "222222" } },
      bottom: { style: "thin", color: { rgb: "222222" } },
      left: { style: "thin", color: { rgb: "222222" } },
      right: { style: "thin", color: { rgb: "222222" } },
    },
    alignment: {
      vertical: "center",
      wrapText: true,
    },
  };

  const estiloHoras = {
    ...estiloCeldaTabla,
    alignment: {
      horizontal: "right",
      vertical: "center",
    },
  };

  function aplicarEstilo(celda, estilo) {
    if (hoja[celda]) {
      hoja[celda].s = estilo;
    }
  }

  for (let fila = 0; fila < totalFilasFondo; fila++) {
    for (let columna = 0; columna < totalColumnasFondo; columna++) {
      const celda = XLSX.utils.encode_cell({ r: fila, c: columna });

      if (!hoja[celda]) {
        hoja[celda] = { t: "s", v: "" };
      }

      hoja[celda].s = estiloFondoBlanco;
    }
  }

  aplicarEstilo("A1", estiloTitulo);
  aplicarEstilo("A2", estiloSubtitulo);
  aplicarEstilo("A3", estiloTitulo);
  aplicarEstilo("A4", estiloTextoCentro);
  aplicarEstilo("A5", estiloTextoCentro);

  for (let fila = 6; fila < filaEncabezadoTabla - 1; fila++) {
    const celdaLabel = XLSX.utils.encode_cell({ r: fila, c: 0 });
    const celdaValor = XLSX.utils.encode_cell({ r: fila, c: 1 });

    aplicarEstilo(celdaLabel, estiloDatoLabel);
    aplicarEstilo(celdaValor, estiloDatoValor);
  }

  for (let columna = 0; columna <= 4; columna++) {
    const celda = XLSX.utils.encode_cell({
      r: filaEncabezadoTabla,
      c: columna,
    });

    aplicarEstilo(celda, estiloEncabezadoTabla);
  }

  for (let fila = filaEncabezadoTabla + 1; fila < datosExcel.length; fila++) {
    for (let columna = 0; columna <= 4; columna++) {
      const celda = XLSX.utils.encode_cell({ r: fila, c: columna });

      if (columna === 3) {
        aplicarEstilo(celda, estiloHoras);

        if (hoja[celda]) {
          hoja[celda].z = "0.00";
        }
      } else {
        aplicarEstilo(celda, estiloCeldaTabla);
      }
    }
  }

  hoja["!rows"] = [];

  for (let i = 0; i < datosExcel.length; i++) {
    hoja["!rows"][i] = { hpt: 22 };
  }

  hoja["!rows"][0] = { hpt: 24 };
  hoja["!rows"][2] = { hpt: 26 };
  hoja["!rows"][filaEncabezadoTabla] = { hpt: 26 };

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Historial");

  const nombreArchivo = `historial_${limpiarTextoArchivo(resumen.nombre)}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}

function exportarHistorialPDF(
  resumen,
  registros,
  nombrePeriodo = "Reporte completo",
  mostrarHorasPeriodo = false,
) {
  if (!registros || registros.length === 0) {
    alert("Este prestador no tiene registros para exportar.");
    return;
  }

  const totales = calcularTotalesExportacion(resumen);
  const horasPeriodo = calcularHorasDeRegistros(registros).toFixed(2);

  const tarjetaHorasPeriodo = mostrarHorasPeriodo
    ? `
        <div>
          <span>Horas del periodo</span>
          <strong>${horasPeriodo}</strong>
        </div>
      `
    : "";

  const columnasResumen = mostrarHorasPeriodo
    ? "repeat(4, 1fr)"
    : "repeat(3, 1fr)";

  const filas = registros
    .map(
      (registro) => `
    <tr>
      <td>${registro.fecha || ""}</td>
      <td>${registro.hora_entrada || "-"}</td>
      <td>${registro.hora_salida || "-"}</td>
      <td>${Number(registro.horas || 0).toFixed(2)}</td>
      <td>${registro.actividad || "-"}</td>
    </tr>
  `,
    )
    .join("");

  const ventana = window.open("", "_blank");

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Historial ${resumen.nombre || ""}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 28px;
          color: #1f2937;
        }

        .encabezado {
          text-align: center;
          margin-bottom: 22px;
        }

        .logo {
          font-weight: 800;
          color: #1e3a8a;
          font-size: 22px;
          margin-bottom: 4px;
        }

        .facultad {
          font-weight: 700;
          color: #1e3a8a;
          font-size: 14px;
          margin-bottom: 8px;
        }

        h1 {
          color: #0f2f6e;
          margin: 0;
          font-size: 24px;
        }

        .subtitulo {
          color: #4b5563;
          margin-top: 8px;
        }

        .datos {
          margin-bottom: 18px;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          padding: 14px;
          background: #f8fafc;
        }

        .datos p {
          margin: 6px 0;
          font-size: 14px;
        }

        .resumen {
          display: grid;
          grid-template-columns: ${columnasResumen};
          gap: 10px;
          margin-bottom: 18px;
        }

        .resumen div {
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          padding: 10px;
          text-align: center;
          background: #f8fafc;
        }

        .resumen span {
          display: block;
          color: #4b5563;
          font-size: 12px;
        }

        .resumen strong {
          display: block;
          color: #0f2f6e;
          font-size: 18px;
          margin-top: 5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 12px;
        }

        th {
          background: #1f3f93;
          color: white;
          padding: 8px;
          border: 1px solid #1f3f93;
          text-align: left;
        }

        td {
          padding: 8px;
          border: 1px solid #dbe5f1;
        }

        .nota {
          margin-top: 18px;
          font-size: 11px;
          color: #4b5563;
          text-align: center;
        }

        @media print {
          button {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="encabezado">
        <div class="logo">BUAP</div>
        <div class="facultad">Facultad de Administración</div>
        <h1>Historial de servicio social</h1>
        <p class="subtitulo">
          <strong>Periodo de servicio social:</strong> ${obtenerTextoPeriodoSeleccionado()}
        </p>
        <p class="subtitulo">${nombrePeriodo}</p>
      </div>

      <div class="datos">
        <p><strong>Prestador:</strong> ${resumen.nombre || ""}</p>
        <p><strong>Matrícula:</strong> ${resumen.matricula || ""}</p>
        <p><strong>Carrera:</strong> ${resumen.carrera || ""}</p>
        <p><strong>Horario:</strong> ${resumen.horario || ""}</p>
        <p><strong>Estatus:</strong> ${resumen.estatus || "activo"}</p>
      </div>

      <div class="resumen">
        ${tarjetaHorasPeriodo}

        <div>
          <span>Horas acumuladas</span>
          <strong>${totales.horasAcumuladas}</strong>
        </div>

        <div>
          <span>Horas faltantes</span>
          <strong>${totales.horasFaltantes}</strong>
        </div>

        <div>
          <span>Horas requeridas</span>
          <strong>${totales.horasRequeridas}</strong>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Actividad</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>

      <p class="nota">
        Documento generado desde el sistema de control de horas de servicio social.
      </p>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);

  ventana.document.close();
}

async function obtenerReporteGeneralCompleto() {
  try {
    const url = periodoSeleccionadoId
      ? `/api/profesor/resumen?periodo_id=${periodoSeleccionadoId}`
      : "/api/profesor/resumen";

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.mensaje || "Error al obtener el reporte general completo.");
      return null;
    }

    return {
      datos: datos.prestadores || [],
    };
  } catch (error) {
    alert("Error al conectar con el servidor.");
    return null;
  }
}

async function generarReportePDF() {
  const tipo = tipoReporte.value;
  const periodo = periodoReporte.value;
  const mes = mesReporteGeneral.value;
  const prestadorId = prestadorReporte.value;

  if (periodo === "mensual" && !mes) {
    alert("Selecciona el mes del reporte.");
    return;
  }

  if (tipo === "prestador" && !prestadorId) {
    alert("Selecciona un prestador.");
    return;
  }

  if (tipo === "general" && periodo === "mensual") {
    await exportarReporteGeneralPDF();
    return;
  }

  if (tipo === "general" && periodo === "completo") {
    await exportarReporteGeneralCompletoPDF();
    return;
  }

  if (tipo === "prestador") {
    const resumen = await obtenerResumenPrestadorReporte(prestadorId);
    const registros = await obtenerRegistrosPrestadorReporte(prestadorId);

    if (!resumen || !registros) {
      return;
    }

    const registrosFinales =
      periodo === "mensual"
        ? filtrarRegistrosPorMes(registros, mes)
        : registros;

    const nombrePeriodo =
      periodo === "mensual" ? obtenerNombreMes(mes) : "Reporte completo";

    exportarHistorialPDF(
      resumen,
      registrosFinales,
      nombrePeriodo,
      periodo === "mensual",
    );
  }
}

async function generarReporteExcel() {
  const tipo = tipoReporte.value;
  const periodo = periodoReporte.value;
  const mes = mesReporteGeneral.value;
  const prestadorId = prestadorReporte.value;

  if (periodo === "mensual" && !mes) {
    alert("Selecciona el mes del reporte.");
    return;
  }

  if (tipo === "prestador" && !prestadorId) {
    alert("Selecciona un prestador.");
    return;
  }

  if (tipo === "general" && periodo === "mensual") {
    await exportarReporteGeneralExcel();
    return;
  }

  if (tipo === "general" && periodo === "completo") {
    await exportarReporteGeneralCompletoExcel();
    return;
  }

  if (tipo === "prestador") {
    const resumen = await obtenerResumenPrestadorReporte(prestadorId);
    const registros = await obtenerRegistrosPrestadorReporte(prestadorId);

    if (!resumen || !registros) {
      return;
    }

    const registrosFinales =
      periodo === "mensual"
        ? filtrarRegistrosPorMes(registros, mes)
        : registros;

    const nombrePeriodo =
      periodo === "mensual" ? obtenerNombreMes(mes) : "Reporte completo";

    exportarHistorialExcel(
      resumen,
      registrosFinales,
      nombrePeriodo,
      periodo === "mensual",
    );
  }
}

async function obtenerResumenPrestadorReporte(id) {
  const respuesta = await fetch(`/api/resumen/${id}`);
  const data = await respuesta.json();

  if (!respuesta.ok) {
    alert(data.mensaje || "Error al obtener resumen del prestador.");
    return null;
  }

  return data.resumen;
}

async function obtenerRegistrosPrestadorReporte(id) {
  const respuesta = await fetch(`/api/profesor/prestador/${id}/registros`);
  const registros = await respuesta.json();

  if (!respuesta.ok) {
    alert(registros.mensaje || "Error al obtener registros del prestador.");
    return null;
  }

  return registros;
}
function actualizarFormularioReportes() {
  if (tipoReporte.value === "prestador") {
    campoPrestadorReporte.classList.remove("hidden");
  } else {
    campoPrestadorReporte.classList.add("hidden");
    prestadorReporte.value = "";
  }

  if (periodoReporte.value === "mensual") {
    campoMesReporte.classList.remove("hidden");
  } else {
    campoMesReporte.classList.add("hidden");
    mesReporteGeneral.value = "";
  }
}
async function cargarPrestadoresParaReportes() {
  try {
    const url = periodoSeleccionadoId
      ? `/api/reportes/prestadores?periodo_id=${periodoSeleccionadoId}`
      : "/api/reportes/prestadores";

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    prestadorReporte.innerHTML = `
      <option value="">Selecciona un prestador</option>
    `;

    if (!respuesta.ok) {
      alert(datos.mensaje || "Error al cargar prestadores para reportes.");
      return;
    }

    const prestadores = datos.prestadores || [];

    prestadores.forEach((p) => {
      const option = document.createElement("option");

      option.value = p.id;
      option.textContent = `${p.nombre} - ${p.matricula} (${p.estatus})`;

      prestadorReporte.appendChild(option);
    });
  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

function limpiarTextoArchivo(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .replace(/_+/g, "_");
}

function obtenerTextoPeriodoSeleccionado() {
  if (!selectorPeriodoResponsable || !selectorPeriodoResponsable.value) {
    return "Periodo no seleccionado";
  }

  const opcionSeleccionada =
    selectorPeriodoResponsable.options[
    selectorPeriodoResponsable.selectedIndex
    ];

  return opcionSeleccionada
    ? opcionSeleccionada.textContent
    : "Periodo no seleccionado";
}