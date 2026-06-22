const PIN_RESPONSABLE = "1234";

const pinSection = document.getElementById("pinSection");
const panelResponsable = document.getElementById("panelResponsable");
const formPin = document.getElementById("formPin");
const pinResponsable = document.getElementById("pinResponsable");
const mensajePin = document.getElementById("mensajePin");
const btnCerrarResponsable = document.getElementById("btnCerrarResponsable");

const tablaProfesor = document.getElementById("tablaProfesor");
const detallePrestador = document.getElementById("detallePrestador");
const nombreDetalle = document.getElementById("nombreDetalle");
const tablaHistorial = document.getElementById("tablaHistorial");
const mesReporteGeneral = document.getElementById("mesReporteGeneral");
const btnReporteGeneralPDF = document.getElementById("btnReporteGeneralPDF");
const btnReporteGeneralExcel = document.getElementById("btnReporteGeneralExcel");

const formEditarRegistroResponsable = document.getElementById("formEditarRegistroResponsable");
const registroResponsableEditandoId = document.getElementById("registroResponsableEditandoId");
const prestadorResponsableEditandoId = document.getElementById("prestadorResponsableEditandoId");
const prestadorResponsableEditandoNombre = document.getElementById("prestadorResponsableEditandoNombre");
const editarFechaResponsable = document.getElementById("editarFechaResponsable");
const editarEntradaResponsable = document.getElementById("editarEntradaResponsable");
const editarSalidaResponsable = document.getElementById("editarSalidaResponsable");
const editarActividadResponsable = document.getElementById("editarActividadResponsable");
const btnGuardarEdicionResponsable = document.getElementById("btnGuardarEdicionResponsable");
const btnCancelarEdicionResponsable = document.getElementById("btnCancelarEdicionResponsable");
const btnMenuResponsable = document.getElementById("btnMenuResponsable");
const menuResponsableOpciones = document.getElementById("menuResponsableOpciones");
const btnMostrarReportes = document.getElementById("btnMostrarReportes");
const btnMostrarArchivados = document.getElementById("btnMostrarArchivados");
const btnCerrarReportes = document.getElementById("btnCerrarReportes");
const btnCerrarArchivados = document.getElementById("btnCerrarArchivados");
const seccionReportesResponsable = document.getElementById("seccionReportesResponsable");
const seccionArchivadosResponsable = document.getElementById("seccionArchivadosResponsable");
const tablaArchivados = document.getElementById("tablaArchivados");

function mostrarPanelResponsable() {
  pinSection.classList.add("hidden");
  panelResponsable.classList.remove("hidden");
  cargarResumenProfesor();
}

function cerrarMenuResponsable() {
  menuResponsableOpciones.classList.add("hidden");
}

function ocultarSeccionesResponsable() {
  seccionReportesResponsable.classList.add("hidden");
  seccionArchivadosResponsable.classList.add("hidden");
}

function mostrarSeccionReportes() {
  const estaVisible = !seccionReportesResponsable.classList.contains("hidden");

  ocultarSeccionesResponsable();

  if (!estaVisible) {
    seccionReportesResponsable.classList.remove("hidden");
    seccionReportesResponsable.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  cerrarMenuResponsable();
}

async function mostrarSeccionArchivados() {
  const estaVisible = !seccionArchivadosResponsable.classList.contains("hidden");

  ocultarSeccionesResponsable();

  if (!estaVisible) {
    await cargarPrestadoresArchivados();

    seccionArchivadosResponsable.classList.remove("hidden");
    seccionArchivadosResponsable.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  cerrarMenuResponsable();
}

formPin.addEventListener("submit", (e) => {
  e.preventDefault();

  if (pinResponsable.value === PIN_RESPONSABLE) {
    sessionStorage.setItem("responsable_autorizado", "true");
    mensajePin.textContent = "";
    mostrarPanelResponsable();
  } else {
    mensajePin.textContent = "PIN incorrecto. Inténtalo nuevamente.";
    mensajePin.className = "mensaje error";
  }
});

btnCerrarResponsable.addEventListener("click", () => {
  sessionStorage.removeItem("responsable_autorizado");
  window.location.href = "index.html";
});

async function cargarResumenProfesor() {
  try {
    const respuesta = await fetch("/api/profesor/resumen");
    const prestadores = await respuesta.json();

    tablaProfesor.innerHTML = "";

    prestadores.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.matricula}</td>
        <td>${p.carrera}</td>
        <td>${p.horario}</td>
        <td>${Number(p.horas_acumuladas).toFixed(2)}</td>
        <td>${Number(p.horas_faltantes).toFixed(2)}</td>
        <td>${p.estatus || "activo"}</td>
        <td>${p.estado_hoy}</td>
        <td>
          <button class="small-btn btn-historial" data-id="${p.id}" data-nombre="${p.nombre}">
            Ver historial
          </button>
        </td>
      `;

      tablaProfesor.appendChild(tr);
    });

    const botonesHistorial = document.querySelectorAll(".btn-historial");

    botonesHistorial.forEach((boton) => {
      boton.addEventListener("click", () => {
        cerrarMenuResponsable();

        const id = boton.dataset.id;
        const nombre = boton.dataset.nombre;
        verHistorial(id, nombre);
      });
    });
  } catch (error) {
    tablaProfesor.innerHTML = `
      <tr>
        <td colspan="9">Error al cargar la información.</td>
      </tr>
    `;
  }
}

async function cargarPrestadoresArchivados() {
  try {
    const respuesta = await fetch("/api/profesor/archivados");
    const archivados = await respuesta.json();

    tablaArchivados.innerHTML = "";

    if (!respuesta.ok) {
      tablaArchivados.innerHTML = `
        <tr>
          <td colspan="6">${archivados.mensaje || "Error al cargar archivados."}</td>
        </tr>
      `;
      return;
    }

    if (archivados.length === 0) {
      tablaArchivados.innerHTML = `
        <tr>
          <td colspan="6">No hay prestadores archivados.</td>
        </tr>
      `;
      return;
    }

    archivados.forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.matricula}</td>
        <td>${p.carrera}</td>
        <td>${Number(p.horas_acumuladas || 0).toFixed(2)}</td>
        <td>${p.estatus || "archivado"}</td>
        <td>
          <button class="small-btn btn-restaurar-archivado" data-id="${p.id}">
            Restaurar
          </button>
        </td>
      `;

      tablaArchivados.appendChild(tr);
    });

    document.querySelectorAll(".btn-restaurar-archivado").forEach((boton) => {
      boton.addEventListener("click", () => {
        restaurarPrestadorArchivado(boton.dataset.id);
      });
    });

  } catch (error) {
    tablaArchivados.innerHTML = `
      <tr>
        <td colspan="6">Error al conectar con el servidor.</td>
      </tr>
    `;
  }
}

function unirDias(dias) {
  if (dias.length === 0) {
    return "";
  }

  const ordenDias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  const indices = dias
    .map((dia) => ordenDias.indexOf(dia))
    .filter((indice) => indice !== -1)
    .sort((a, b) => a - b);

  const sonConsecutivos = indices.every((indice, posicion) => {
    if (posicion === 0) return true;
    return indice === indices[posicion - 1] + 1;
  });

  if (sonConsecutivos && indices.length >= 3) {
    const primerDia = ordenDias[indices[0]];
    const ultimoDia = ordenDias[indices[indices.length - 1]];

    return `${primerDia} a ${ultimoDia}`;
  }

  if (dias.length === 1) {
    return dias[0];
  }

  if (dias.length === 2) {
    return `${dias[0]} y ${dias[1]}`;
  }

  return `${dias.slice(0, -1).join(", ")} y ${dias[dias.length - 1]}`;
}

function armarHorario(dias, horaEntrada, horaSalida) {
  if (dias.length === 0 || !horaEntrada || !horaSalida) {
    return "";
  }

  return `${unirDias(dias)} de ${horaEntrada} a ${horaSalida}`;
}

function obtenerDatosHorario(horario) {
  const dias = [];
  let horaEntrada = "";
  let horaSalida = "";

  if (!horario) {
    return { dias, horaEntrada, horaSalida };
  }

  const partes = horario.split(" de ");

  if (partes.length === 2) {
    const diasTexto = partes[0];
    const horasTexto = partes[1];

    ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].forEach((dia) => {
      if (diasTexto.includes(dia)) {
        dias.push(dia);
      }
    });

    const horas = horasTexto.split(" a ");

    if (horas.length === 2) {
      horaEntrada = horas[0];
      horaSalida = horas[1];
    }
  }

  return { dias, horaEntrada, horaSalida };
}

async function verHistorial(id, nombre) {
  try {
    const respuestaHistorial = await fetch(`/api/profesor/prestador/${id}/registros`);
    const registros = await respuestaHistorial.json();

    const respuestaResumen = await fetch(`/api/resumen/${id}`);
    const dataResumen = await respuestaResumen.json();

    const resumen = dataResumen.resumen;
    const datosHorario = obtenerDatosHorario(resumen.horario);

    detallePrestador.classList.remove("hidden");

    setTimeout(() => {
      detallePrestador.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

    nombreDetalle.innerHTML = `
      <strong>Prestador:</strong> ${nombre}

      <div class="resumen-prestador-responsable">
        <div>
          <span>Horas acumuladas</span>
          <strong>${Number(resumen.horas_acumuladas).toFixed(2)}</strong>
        </div>

        <div>
          <span>Horas faltantes</span>
          <strong>${Number(resumen.horas_faltantes).toFixed(2)}</strong>
        </div>

        <div>
          <span>Horas requeridas</span>
          <strong>${Number(resumen.horas_requeridas).toFixed(2)}</strong>
        </div>
      </div>

      <div class="acciones-historial-card">
        <div class="acciones-historial-info">
          <strong>Menu Prestador</strong>
        </div>

        <div class="acciones-historial-botones">
          <button class="btn-mini btn-editar-prestador-detalle" type="button">
            Editar datos
          </button>

          <button class="btn-mini btn-exportar-pdf-detalle" type="button">
            Exportar a PDF
          </button>

          <button class="btn-mini btn-exportar-excel-detalle" type="button">
            Exportar a Excel
          </button>

          <details class="menu-mas-opciones">
            <summary>Más opciones</summary>

            <div class="menu-mas-opciones-lista">
              <button class="btn-mini btn-finalizar-detalle" type="button">
                Finalizar
              </button>

              <button class="btn-mini btn-activar-detalle" type="button">
                Reactivar
              </button>

              <button class="btn-mini-danger btn-archivar-detalle" type="button">
                Archivar
              </button>

              <button class="btn-mini btn-ocultar-historial-detalle" type="button">
                Ocultar historial
              </button>
            </div>
          </details>
        </div>
      </div>

      <div id="formEditarPrestador" class="form-editar-prestador hidden">
      <h3>Editar datos del prestador</h3>

  <label for="editarNombrePrestador">Nombre completo</label>
  <input type="text" id="editarNombrePrestador" value="${resumen.nombre}">

  <label for="editarMatriculaPrestador">Matrícula</label>
  <input type="text" id="editarMatriculaPrestador" value="${resumen.matricula}">

  <label for="editarCarreraPrestador">Carrera</label>
  <select id="editarCarreraPrestador">
    <option value="">Selecciona una carrera</option>
    <option value="Ingeniería en Tecnologías de la Información">
      Ingeniería en Tecnologías de la Información
    </option>
    <option value="Ingeniería en Ciencias de la Computación">
      Ingeniería en Ciencias de la Computación
    </option>
    <option value="Licenciatura en Ciencias de la Computación">
      Licenciatura en Ciencias de la Computación
    </option>
    <option value="Licenciatura en Ciencias de la Computación">
      Administración
    </option>
  </select>

  <label>Días de servicio</label>

  <div class="dias-grid">
    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Lunes">
      Lunes
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Martes">
      Martes
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Miércoles">
      Miércoles
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Jueves">
      Jueves
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Viernes">
      Viernes
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Sábado">
      Sábado
    </label>

    <label class="check-option">
      <input type="checkbox" name="editarDiasServicio" value="Domingo">
      Domingo
    </label>
  </div>

  <div class="horario-grid">
    <div>
      <label for="editarHoraEntradaServicio">Hora de entrada</label>
      <input type="time" id="editarHoraEntradaServicio" value="${datosHorario.horaEntrada}">
    </div>

    <div>
      <label for="editarHoraSalidaServicio">Hora de salida</label>
      <input type="time" id="editarHoraSalidaServicio" value="${datosHorario.horaSalida}">
    </div>
  </div>

  <label for="editarHorasRequeridasPrestador">Horas requeridas</label>
  <input type="number" id="editarHorasRequeridasPrestador" value="${Number(resumen.horas_requeridas)}">

  <div class="buttons">
    <button type="button" id="btnGuardarPrestadorEditado">
      Guardar cambios
    </button>

    <button type="button" id="btnCancelarPrestadorEditado" class="secondary-btn">
      Cancelar
    </button>
  </div>
</div>
    `;

    document.querySelector(".btn-finalizar-detalle").addEventListener("click", () => {
      finalizarPrestador(id);
    });

    document.querySelector(".btn-activar-detalle").addEventListener("click", () => {
      activarPrestador(id);
    });

    document.querySelector(".btn-archivar-detalle").addEventListener("click", () => {
      archivarPrestador(id, nombre);
    });

    document.querySelector(".btn-editar-prestador-detalle").addEventListener("click", () => {
      mostrarFormularioEditarPrestador(resumen);
    });

    document.querySelector(".btn-ocultar-historial-detalle").addEventListener("click", () => {
      ocultarHistorialResponsable();
    });

    document.querySelector(".btn-exportar-pdf-detalle").addEventListener("click", () => {
      exportarHistorialPDF(resumen, registros);
    });

    document.querySelector(".btn-exportar-excel-detalle").addEventListener("click", () => {
      exportarHistorialExcel(resumen, registros);
    });

    document.getElementById("btnGuardarPrestadorEditado").addEventListener("click", () => {
      guardarDatosPrestadorEditado(id);
    });

    document.getElementById("btnCancelarPrestadorEditado").addEventListener("click", () => {
      document.getElementById("formEditarPrestador").classList.add("hidden");
    });

    prestadorResponsableEditandoId.value = id;
    prestadorResponsableEditandoNombre.value = nombre;

    tablaHistorial.innerHTML = "";

    if (registros.length === 0) {
      tablaHistorial.innerHTML = `
        <tr>
          <td colspan="6">Este prestador todavía no tiene registros.</td>
        </tr>
      `;
      return;
    }

    registros.forEach((r) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${r.fecha}</td>
        <td>${r.hora_entrada || "-"}</td>
        <td>${r.hora_salida || "-"}</td>
        <td>${Number(r.horas).toFixed(2)}</td>
        <td>${r.actividad || "-"}</td>
        <td>
          <button 
            class="icon-btn btn-editar-responsable"
            title="Editar registro"
            data-id="${r.id}"
            data-fecha="${r.fecha}"
            data-entrada="${r.hora_entrada || ""}"
            data-salida="${r.hora_salida || ""}"
            data-actividad="${r.actividad || ""}"
            >
            ✏️
          </button>
        </td>
      `;

      tablaHistorial.appendChild(tr);
    });

    activarBotonesHistorialResponsable();

  } catch (error) {
    tablaHistorial.innerHTML = `
      <tr>
        <td colspan="6">Error al cargar historial.</td>
      </tr>
    `;
  }
}

function mostrarFormularioEditarPrestador(resumen) {
  const formEditarPrestador = document.getElementById("formEditarPrestador");

  document.getElementById("editarNombrePrestador").value = resumen.nombre;
  document.getElementById("editarMatriculaPrestador").value = resumen.matricula;
  document.getElementById("editarCarreraPrestador").value = resumen.carrera;
  document.getElementById("editarHorasRequeridasPrestador").value = Number(resumen.horas_requeridas);

  const datosHorario = obtenerDatosHorario(resumen.horario);

  document.querySelectorAll("input[name='editarDiasServicio']").forEach((checkbox) => {
    checkbox.checked = datosHorario.dias.includes(checkbox.value);
  });

  document.getElementById("editarHoraEntradaServicio").value = datosHorario.horaEntrada;
  document.getElementById("editarHoraSalidaServicio").value = datosHorario.horaSalida;

  formEditarPrestador.classList.remove("hidden");
  formEditarPrestador.scrollIntoView({ behavior: "smooth" });
}

async function guardarDatosPrestadorEditado(id) {
  const diasSeleccionados = Array.from(
    document.querySelectorAll("input[name='editarDiasServicio']:checked")
  ).map((dia) => dia.value);

  const horaEntradaServicio = document.getElementById("editarHoraEntradaServicio").value;
  const horaSalidaServicio = document.getElementById("editarHoraSalidaServicio").value;

  if (diasSeleccionados.length === 0) {
    alert("Selecciona al menos un día de servicio.");
    return;
  }

  if (!horaEntradaServicio) {
    alert("La hora de entrada es obligatoria.");
    return;
  }

  if (!horaSalidaServicio) {
    alert("La hora de salida es obligatoria.");
    return;
  }

  if (horaSalidaServicio <= horaEntradaServicio) {
    alert("La hora de salida debe ser mayor que la hora de entrada.");
    return;
  }

  const horarioArmado = armarHorario(
    diasSeleccionados,
    horaEntradaServicio,
    horaSalidaServicio
  );

  const datos = {
    nombre: document.getElementById("editarNombrePrestador").value.trim(),
    matricula: document.getElementById("editarMatriculaPrestador").value.trim(),
    carrera: document.getElementById("editarCarreraPrestador").value.trim(),
    horario: horarioArmado,
    horas_requeridas: Number(document.getElementById("editarHorasRequeridasPrestador").value)
  };

  if (!datos.nombre) {
    alert("El nombre es obligatorio.");
    return;
  }

  if (!datos.matricula) {
    alert("La matrícula es obligatoria.");
    return;
  }

  if (!datos.carrera) {
    alert("La carrera es obligatoria.");
    return;
  }

  if (!datos.horas_requeridas || datos.horas_requeridas <= 0) {
    alert("Las horas requeridas deben ser mayor a 0.");
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert(resultado.mensaje);

    document.getElementById("formEditarPrestador").classList.add("hidden");

    prestadorResponsableEditandoNombre.value = datos.nombre;

    await cargarResumenProfesor();
    await verHistorial(id, datos.nombre);

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

function calcularTotalesExportacion(resumen) {
  return {
    horasAcumuladas: Number(resumen.horas_acumuladas || 0).toFixed(2),
    horasFaltantes: Number(resumen.horas_faltantes || 0).toFixed(2),
    horasRequeridas: Number(resumen.horas_requeridas || 0).toFixed(2)
  };
}


function obtenerNombreMes(mes) {
  const [anio, numeroMes] = mes.split("-");
  const fecha = new Date(Number(anio), Number(numeroMes) - 1, 1);

  return fecha.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric"
  });
}

async function obtenerReporteMensualGeneral() {
  const mes = mesReporteGeneral.value;

  if (!mes) {
    alert("Selecciona el mes del reporte.");
    return null;
  }

  try {
    const respuesta = await fetch(`/api/reportes/mensual-general?mes=${mes}`);
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      alert(datos.mensaje || "Error al obtener el reporte mensual.");
      return null;
    }

    return {
      mes,
      nombreMes: obtenerNombreMes(mes),
      datos
    };

  } catch (error) {
    alert("Error al conectar con el servidor.");
    return null;
  }
}

async function exportarReporteGeneralExcel() {
  const reporte = await obtenerReporteMensualGeneral();

  if (!reporte) {
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería para generar Excel.");
    return;
  }

  const datosExcel = [
    [`Reporte mensual general - ${reporte.nombreMes}`],
    [],
    ["Nombre", "Matrícula", "Carrera", "Horario", "Horas del mes", "Horas acumuladas", "Horas faltantes", "Estatus"]
  ];

  reporte.datos.forEach((p) => {
    datosExcel.push([
      p.nombre || "",
      p.matricula || "",
      p.carrera || "",
      p.horario || "",
      Number(p.horas_mes || 0),
      Number(p.horas_acumuladas || 0),
      Number(p.horas_faltantes || 0),
      p.estatus || "activo"
    ]);
  });

  const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

  hoja["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 38 },
    { wch: 36 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 }
  ];

  hoja["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 7 }
    }
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Reporte mensual");

  const nombreArchivo = `reporte_mensual_general_${reporte.mes}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}

async function exportarReporteGeneralPDF() {
  const reporte = await obtenerReporteMensualGeneral();

  if (!reporte) {
    return;
  }

  const filas = reporte.datos.map((p) => `
    <tr>
      <td>${p.nombre || ""}</td>
      <td>${p.matricula || ""}</td>
      <td>${p.carrera || ""}</td>
      <td>${Number(p.horas_mes || 0).toFixed(2)}</td>
      <td>${Number(p.horas_acumuladas || 0).toFixed(2)}</td>
      <td>${Number(p.horas_faltantes || 0).toFixed(2)}</td>
      <td>${p.estatus || "activo"}</td>
    </tr>
  `).join("");

  const ventana = window.open("", "_blank");

  ventana.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte mensual general</title>
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
          margin-bottom: 6px;
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
          font-size: 11px;
        }

        th {
          background: #1f3f93;
          color: white;
          padding: 8px;
          border: 1px solid #1f3f93;
          text-align: left;
        }

        td {
          padding: 7px;
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
        <h1>Reporte mensual general</h1>
        <p class="subtitulo">${reporte.nombreMes}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Matrícula</th>
            <th>Carrera</th>
            <th>Horas mes</th>
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


function exportarHistorialExcel(resumen, registros) {
  if (!registros || registros.length === 0) {
    alert("Este prestador no tiene registros para exportar.");
    return;
  }

  if (typeof XLSX === "undefined") {
    alert("No se pudo cargar la librería para generar Excel. Revisa tu conexión a internet.");
    return;
  }

  const totales = calcularTotalesExportacion(resumen);

  const datosExcel = [
    ["Historial de servicio social"],
    [],
    ["Prestador", resumen.nombre || ""],
    ["Matrícula", resumen.matricula || ""],
    ["Carrera", resumen.carrera || ""],
    ["Horario", resumen.horario || ""],
    ["Estatus", resumen.estatus || "activo"],
    [],
    ["Horas acumuladas", totales.horasAcumuladas],
    ["Horas faltantes", totales.horasFaltantes],
    ["Horas requeridas", totales.horasRequeridas],
    [],
    ["Fecha", "Entrada", "Salida", "Horas", "Actividad"]
  ];

  registros.forEach((registro) => {
    datosExcel.push([
      registro.fecha || "",
      registro.hora_entrada || "-",
      registro.hora_salida || "-",
      Number(registro.horas || 0),
      registro.actividad || "-"
    ]);
  });

  const hoja = XLSX.utils.aoa_to_sheet(datosExcel);

  hoja["!cols"] = [
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 45 }
  ];

  hoja["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 4 }
    }
  ];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Historial");

  const nombreArchivo = `historial_${limpiarTextoArchivo(resumen.nombre)}.xlsx`;

  XLSX.writeFile(libro, nombreArchivo);
}

function exportarHistorialPDF(resumen, registros) {
  if (!registros || registros.length === 0) {
    alert("Este prestador no tiene registros para exportar.");
    return;
  }

  const totales = calcularTotalesExportacion(resumen);

  const filas = registros.map((registro) => `
    <tr>
      <td>${registro.fecha || ""}</td>
      <td>${registro.hora_entrada || "-"}</td>
      <td>${registro.hora_salida || "-"}</td>
      <td>${Number(registro.horas || 0).toFixed(2)}</td>
      <td>${registro.actividad || "-"}</td>
    </tr>
  `).join("");

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
          margin-bottom: 6px;
        }

        h1 {
          color: #0f2f6e;
          margin: 0;
          font-size: 24px;
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
          grid-template-columns: repeat(3, 1fr);
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
        <h1>Historial de servicio social</h1>
      </div>

      <div class="datos">
        <p><strong>Prestador:</strong> ${resumen.nombre || ""}</p>
        <p><strong>Matrícula:</strong> ${resumen.matricula || ""}</p>
        <p><strong>Carrera:</strong> ${resumen.carrera || ""}</p>
        <p><strong>Horario:</strong> ${resumen.horario || ""}</p>
        <p><strong>Estatus:</strong> ${resumen.estatus || "activo"}</p>
      </div>

      <div class="resumen">
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

function activarBotonesHistorialResponsable() {
  const botonesEditar = document.querySelectorAll(".btn-editar-responsable");

  botonesEditar.forEach((boton) => {
    boton.addEventListener("click", () => {
      registroResponsableEditandoId.value = boton.dataset.id;
      editarFechaResponsable.value = boton.dataset.fecha;
      editarEntradaResponsable.value = boton.dataset.entrada;
      editarSalidaResponsable.value = boton.dataset.salida;
      editarActividadResponsable.value = boton.dataset.actividad;

      formEditarRegistroResponsable.classList.remove("hidden");
      formEditarRegistroResponsable.scrollIntoView({ behavior: "smooth" });
    });
  });
}

async function guardarEdicionResponsable() {
  const id = registroResponsableEditandoId.value;

  if (!id) {
    alert("No hay ningún registro seleccionado para editar.");
    return;
  }

  if (!editarFechaResponsable.value || !editarEntradaResponsable.value || !editarSalidaResponsable.value) {
    alert("Completa fecha, hora de entrada y hora de salida.");
    return;
  }

  const respuesta = await fetch(`/api/registros/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fecha: editarFechaResponsable.value,
      hora_entrada: editarEntradaResponsable.value,
      hora_salida: editarSalidaResponsable.value,
      actividad: editarActividadResponsable.value.trim()
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    alert(resultado.mensaje);
    return;
  }

  alert(resultado.mensaje);
  limpiarFormularioEdicionResponsable();

  const prestadorId = prestadorResponsableEditandoId.value;
  const prestadorNombre = prestadorResponsableEditandoNombre.value;

  await verHistorial(prestadorId, prestadorNombre);
  await cargarResumenProfesor();
}

async function finalizarPrestador(id) {
  const confirmar = confirm("¿Seguro que deseas marcar este prestador como finalizado?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/finalizar`, {
      method: "PATCH"
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert(resultado.mensaje);

    const prestadorId = prestadorResponsableEditandoId.value;
    const prestadorNombre = prestadorResponsableEditandoNombre.value;

    await cargarResumenProfesor();

    if (prestadorId && prestadorNombre) {
      await verHistorial(prestadorId, prestadorNombre);
    }

  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

async function activarPrestador(id) {
  const confirmar = confirm("¿Seguro que deseas reactivar este prestador?");

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/activar`, {
      method: "PATCH"
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert(resultado.mensaje);

    const prestadorId = prestadorResponsableEditandoId.value;
    const prestadorNombre = prestadorResponsableEditandoNombre.value;

    await cargarResumenProfesor();

    if (prestadorId && prestadorNombre) {
      await verHistorial(prestadorId, prestadorNombre);
    }

  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

async function archivarPrestador(id, nombre) {
  const confirmar = confirm(
    `¿Seguro que deseas archivar a ${nombre}?\n\n` +
    "El prestador dejará de aparecer en la tabla principal del responsable.\n" +
    "Sus registros e historial NO se eliminarán.\n\n" +
    "Podrás consultarlo y restaurarlo después desde la sección Ver archivados."
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/archivar`, {
      method: "PATCH"
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert(resultado.mensaje);

    detallePrestador.classList.add("hidden");
    formEditarRegistroResponsable.classList.add("hidden");
    tablaHistorial.innerHTML = "";
    nombreDetalle.innerHTML = "";

    limpiarFormularioEdicionResponsable();

    prestadorResponsableEditandoId.value = "";
    prestadorResponsableEditandoNombre.value = "";

    await cargarResumenProfesor();

    if (!seccionArchivadosResponsable.classList.contains("hidden")) {
      await cargarPrestadoresArchivados();
    }

  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

async function restaurarPrestadorArchivado(id) {
  const confirmar = confirm(
    "¿Seguro que deseas restaurar este prestador?\n\n" +
    "Volverá a aparecer en la tabla principal del responsable con estado activo."
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/activar`, {
      method: "PATCH"
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert("Prestador restaurado correctamente.");

    await cargarPrestadoresArchivados();
    await cargarResumenProfesor();

  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}


function ocultarHistorialResponsable() {
  detallePrestador.classList.add("hidden");
  tablaHistorial.innerHTML = "";
  nombreDetalle.innerHTML = "";

  limpiarFormularioEdicionResponsable();

  prestadorResponsableEditandoId.value = "";
  prestadorResponsableEditandoNombre.value = "";
}

function limpiarFormularioEdicionResponsable() {
  registroResponsableEditandoId.value = "";
  editarFechaResponsable.value = "";
  editarEntradaResponsable.value = "";
  editarSalidaResponsable.value = "";
  editarActividadResponsable.value = "";
  formEditarRegistroResponsable.classList.add("hidden");
}

btnGuardarEdicionResponsable.addEventListener("click", guardarEdicionResponsable);
btnCancelarEdicionResponsable.addEventListener("click", limpiarFormularioEdicionResponsable);
btnReporteGeneralExcel.addEventListener("click", exportarReporteGeneralExcel);
btnReporteGeneralPDF.addEventListener("click", exportarReporteGeneralPDF);

btnMenuResponsable.addEventListener("click", () => {
  menuResponsableOpciones.classList.toggle("hidden");
});

btnMostrarReportes.addEventListener("click", mostrarSeccionReportes);
btnMostrarArchivados.addEventListener("click", mostrarSeccionArchivados);

btnCerrarReportes.addEventListener("click", () => {
  seccionReportesResponsable.classList.add("hidden");
});

btnCerrarArchivados.addEventListener("click", () => {
  seccionArchivadosResponsable.classList.add("hidden");
});

if (sessionStorage.getItem("responsable_autorizado") === "true") {
  mostrarPanelResponsable();
}