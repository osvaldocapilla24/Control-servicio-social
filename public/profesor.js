const pinSection = document.getElementById("pinSection");
const panelResponsable = document.getElementById("panelResponsable");
const formPin = document.getElementById("formPin");
const pinResponsable = document.getElementById("pinResponsable");
const mensajePin = document.getElementById("mensajePin");
const btnCerrarResponsable = document.getElementById("sidebarCerrarSesion");

const tablaProfesor = document.getElementById("tablaProfesor");
const detallePrestador = document.getElementById("detallePrestador");
const nombreDetalle = document.getElementById("nombreDetalle");
const tablaHistorial = document.getElementById("tablaHistorial");
const tipoReporte = document.getElementById("tipoReporte");
const campoPrestadorReporte = document.getElementById("campoPrestadorReporte");
const prestadorReporte = document.getElementById("prestadorReporte");
const periodoReporte = document.getElementById("periodoReporte");
const campoMesReporte = document.getElementById("campoMesReporte");
const mesReporteGeneral = document.getElementById("mesReporteGeneral");
const btnGenerarReportePDF = document.getElementById("btnGenerarReportePDF");
const btnGenerarReporteExcel = document.getElementById(
  "btnGenerarReporteExcel",
);

const formEditarRegistroResponsable = document.getElementById(
  "formEditarRegistroResponsable",
);
const registroResponsableEditandoId = document.getElementById(
  "registroResponsableEditandoId",
);
const prestadorResponsableEditandoId = document.getElementById(
  "prestadorResponsableEditandoId",
);
const prestadorResponsableEditandoNombre = document.getElementById(
  "prestadorResponsableEditandoNombre",
);
const editarFechaResponsable = document.getElementById(
  "editarFechaResponsable",
);
const editarEntradaResponsable = document.getElementById(
  "editarEntradaResponsable",
);
const editarSalidaResponsable = document.getElementById(
  "editarSalidaResponsable",
);
const editarActividadResponsable = document.getElementById(
  "editarActividadResponsable",
);
const btnGuardarEdicionResponsable = document.getElementById(
  "btnGuardarEdicionResponsable",
);
const btnCancelarEdicionResponsable = document.getElementById(
  "btnCancelarEdicionResponsable",
);
const seccionReportesResponsable = document.getElementById(
  "seccionReportesResponsable",
);
const seccionArchivadosResponsable = document.getElementById(
  "seccionArchivadosResponsable",
);
const tablaArchivados = document.getElementById("tablaArchivados");
const textoPeriodoActual = document.getElementById("textoPeriodoActual");
const selectorPeriodoResponsable = document.getElementById(
  "selectorPeriodoResponsable",
);
const btnCerrarPeriodoActual = document.getElementById(
  "btnCerrarPeriodoActual",
);

let periodoActualGlobal = null;
let periodoSeleccionadoId = null;

async function mostrarPanelResponsable() {
  pinSection.classList.add("hidden");
  panelResponsable.classList.remove("hidden");

  await cargarPeriodosResponsable();
}

function cerrarMenuResponsable() {
  cerrarSidebarMovil();
}

function ocultarSeccionesResponsable() {
  seccionReportesResponsable.classList.add("hidden");
  seccionArchivadosResponsable.classList.add("hidden");
  detallePrestador.classList.add("hidden");
  formEditarRegistroResponsable.classList.add("hidden");
}

async function cargarPeriodosResponsable() {
  try {
    const respuestaActual = await fetch("/api/periodos/actual");
    const periodoActual = await respuestaActual.json();

    if (!respuestaActual.ok) {
      textoPeriodoActual.textContent =
        periodoActual.mensaje || "No hay periodo actual";
      selectorPeriodoResponsable.innerHTML = `
        <option value="">Sin periodos</option>
      `;
      await cargarResumenProfesor();
      return;
    }

    periodoActualGlobal = periodoActual;
    periodoSeleccionadoId = periodoActual.id;

    textoPeriodoActual.textContent = `${periodoActual.nombre} ${periodoActual.anio}`;

    const respuestaPeriodos = await fetch("/api/periodos");
    const periodos = await respuestaPeriodos.json();

    selectorPeriodoResponsable.innerHTML = "";

    if (!respuestaPeriodos.ok || periodos.length === 0) {
      selectorPeriodoResponsable.innerHTML = `
        <option value="">Sin periodos</option>
      `;
      await cargarResumenProfesor();
      return;
    }

    periodos
      .sort((a, b) => {
        if (a.es_actual) return -1;
        if (b.es_actual) return 1;

        if (a.estatus !== "archivado" && b.estatus === "archivado") return -1;
        if (a.estatus === "archivado" && b.estatus !== "archivado") return 1;

        return b.anio - a.anio;
      })
      .forEach((periodo) => {
        const option = document.createElement("option");

        option.value = periodo.id;

        let textoPeriodo = `${periodo.nombre} ${periodo.anio}`;

        if (periodo.es_actual) {
          textoPeriodo += " · Actual";
        }

        if (periodo.estatus === "archivado") {
          textoPeriodo += " · Cerrado";
        }

        option.textContent = textoPeriodo;

        if (periodo.id === periodoActual.id) {
          option.selected = true;
        }

        selectorPeriodoResponsable.appendChild(option);
      });

    selectorPeriodoResponsable.dispatchEvent(new Event("change"));

    await cargarResumenProfesor();
  } catch (error) {
    textoPeriodoActual.textContent = "Error al cargar periodo";
    selectorPeriodoResponsable.innerHTML = `
      <option value="">Error</option>
    `;
    await cargarResumenProfesor();
  }
}

async function mostrarSeccionReportes() {
  cambiarVistaResponsable("reportes");

  seccionReportesResponsable.classList.remove("hidden");

  await cargarPrestadoresParaReportes();

  cerrarMenuResponsable();
}

async function mostrarSeccionArchivados() {
  cambiarVistaResponsable("archivados");

  seccionArchivadosResponsable.classList.remove("hidden");

  await cargarPrestadoresArchivados();

  cerrarMenuResponsable();
}

formPin.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pin = pinResponsable.value.trim();

  if (!pin) {
    mensajePin.textContent = "Debes ingresar la contraseña.";
    mensajePin.className = "mensaje error";
    return;
  }

  try {
    const respuesta = await fetch("/api/responsable/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pin }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mensajePin.textContent = resultado.mensaje || "Contraseña incorrecta.";
      mensajePin.className = "mensaje error";
      return;
    }

    sessionStorage.setItem("responsable_autorizado", "true");
    mensajePin.textContent = "";
    pinResponsable.value = "";

    mostrarPanelResponsable();
  } catch (error) {
    mensajePin.textContent = "Error al conectar con el servidor.";
    mensajePin.className = "mensaje error";
  }
});

btnCerrarResponsable.addEventListener("click", () => {
  sessionStorage.removeItem("responsable_autorizado");
  window.location.href = "index.html";
});

async function cargarPrestadoresArchivados() {
  try {
    const url = periodoSeleccionadoId
      ? `/api/profesor/archivados?periodo_id=${periodoSeleccionadoId}`
      : "/api/profesor/archivados";

    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    tablaArchivados.innerHTML = "";

    if (!respuesta.ok) {
      tablaArchivados.innerHTML = `
        <tr>
          <td colspan="6">${datos.mensaje || "Error al cargar archivados."}</td>
        </tr>
      `;
      return;
    }

    const archivados = datos.prestadores || [];

    if (archivados.length === 0) {
      tablaArchivados.innerHTML = `
        <tr>
          <td colspan="6">No hay prestadores archivados en este periodo.</td>
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

async function eliminarRegistroResponsable(id) {
  const confirmar = confirm(
    "¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.",
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/registros/${id}`, {
      method: "DELETE",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "Error al eliminar el registro.");
      return;
    }

    alert(resultado.mensaje || "Registro eliminado correctamente.");

    const prestadorId = prestadorResponsableEditandoId.value;
    const prestadorNombre = prestadorResponsableEditandoNombre.value;

    if (prestadorId && prestadorNombre) {
      await verHistorial(prestadorId, prestadorNombre, false);
    }

    await cargarResumenProfesor();
  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

const btnCerrarModalEdicion = document.getElementById(
  "btnCerrarModalEdicion"
);

let botonEdicionAnterior = null;

function abrirModalEdicionRegistro(boton) {
  botonEdicionAnterior = boton;

  registroResponsableEditandoId.value = boton.dataset.id;
  editarFechaResponsable.value = boton.dataset.fecha;
  editarEntradaResponsable.value = boton.dataset.entrada;
  editarSalidaResponsable.value = boton.dataset.salida;
  editarActividadResponsable.value = boton.dataset.actividad;

  formEditarRegistroResponsable.classList.remove("hidden");
  document.body.classList.add("modal-registro-abierto");

  btnCerrarModalEdicion.focus();
}

function cerrarModalEdicionRegistro() {
  const estabaAbierto = !formEditarRegistroResponsable.classList.contains("hidden");

  formEditarRegistroResponsable.classList.add("hidden");
  document.body.classList.remove("modal-registro-abierto");

  registroResponsableEditandoId.value = "";
  editarFechaResponsable.value = "";
  editarEntradaResponsable.value = "";
  editarSalidaResponsable.value = "";
  editarActividadResponsable.value = "";

  if (estabaAbierto && botonEdicionAnterior?.isConnected) {
    botonEdicionAnterior.focus({ preventScroll: true });
  }

  botonEdicionAnterior = null;
}

btnCerrarModalEdicion.addEventListener("click", cerrarModalEdicionRegistro);

document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    !formEditarRegistroResponsable.classList.contains("hidden")
  ) {
    cerrarModalEdicionRegistro();
  }
});

formEditarRegistroResponsable.addEventListener("click", (e) => {
  if (e.target === formEditarRegistroResponsable) {
    cerrarModalEdicionRegistro();
  }
});
function activarBotonesHistorialResponsable() {
  const botonesEditar = document.querySelectorAll(".btn-editar-responsable");
  const botonesEliminar = document.querySelectorAll(
    ".btn-eliminar-responsable",
  );

  botonesEditar.forEach((boton) => {
    boton.addEventListener("click", () => {
      abrirModalEdicionRegistro(boton);
    });
  });

  botonesEliminar.forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarRegistroResponsable(boton.dataset.id);
    });
  });
}

async function guardarEdicionResponsable() {
  const id = registroResponsableEditandoId.value;

  if (!id) {
    alert("No hay ningún registro seleccionado para editar.");
    return;
  }

  if (
    !editarFechaResponsable.value ||
    !editarEntradaResponsable.value ||
    !editarSalidaResponsable.value
  ) {
    alert("Completa fecha, hora de entrada y hora de salida.");
    return;
  }

  const respuesta = await fetch(`/api/registros/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fecha: editarFechaResponsable.value,
      hora_entrada: editarEntradaResponsable.value,
      hora_salida: editarSalidaResponsable.value,
      actividad: editarActividadResponsable.value.trim(),
    }),
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    alert(resultado.mensaje);
    return;
  }

  const prestadorId = prestadorResponsableEditandoId.value;
  const prestadorNombre = prestadorResponsableEditandoNombre.value;

  const posicionAnterior = window.scrollY;

  limpiarFormularioEdicionResponsable();

  await verHistorial(prestadorId, prestadorNombre, false);
  await cargarResumenProfesor();

  window.scrollTo({
    top: posicionAnterior,
    behavior: "instant"
  });

  alert(resultado.mensaje || "Registro actualizado correctamente.");
}

function ocultarHistorialResponsable() {
  detallePrestador.classList.add("hidden");
  tablaHistorial.innerHTML = "";
  nombreDetalle.innerHTML = "";

  limpiarFormularioEdicionResponsable();

  prestadorResponsableEditandoId.value = "";
  prestadorResponsableEditandoNombre.value = "";

  tablaProfesor.closest(".tabla-scroll-responsable").classList.remove("hidden");
}

function limpiarFormularioEdicionResponsable() {
  cerrarModalEdicionRegistro();
}

async function cerrarPeriodoActual() {
  if (!periodoActualGlobal || !periodoActualGlobal.id) {
    alert("No hay un periodo actual cargado.");
    return;
  }

  const siguientePeriodo = prompt(
    "¿A qué periodo deseas pasar ahora?\n\n" +
    "Opciones válidas: Primavera, Verano u Otoño",
    "Otoño",
  );

  if (!siguientePeriodo) {
    return;
  }

  const siguienteAnioTexto = prompt(
    "¿Qué año tendrá el siguiente periodo?",
    new Date().getFullYear(),
  );

  if (!siguienteAnioTexto) {
    return;
  }

  const siguienteAnio = Number(siguienteAnioTexto);

  if (!Number.isInteger(siguienteAnio)) {
    alert("El año debe ser un número válido.");
    return;
  }

  const confirmar = confirm(
    `Vas a cerrar el periodo ${periodoActualGlobal.nombre} ${periodoActualGlobal.anio}.\n\n` +
    "Esto archivará a todos los prestadores de ese periodo.\n" +
    "Sus registros e historial NO se eliminarán.\n\n" +
    `Después el periodo actual será: ${siguientePeriodo} ${siguienteAnio}.\n\n` +
    "¿Deseas continuar?",
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(
      `/api/periodos/${periodoActualGlobal.id}/cerrar`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siguiente_periodo: siguientePeriodo,
          siguiente_anio: siguienteAnio,
        }),
      },
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje || "No se pudo cerrar el periodo.");
      return;
    }

    alert(resultado.mensaje);

    ocultarSeccionesResponsable();
    await cargarPeriodosResponsable();
  } catch (error) {
    alert("Error al conectar con el servidor.");
  }
}

btnGuardarEdicionResponsable.addEventListener(
  "click",
  guardarEdicionResponsable,
);
btnCancelarEdicionResponsable.addEventListener(
  "click",
  limpiarFormularioEdicionResponsable,
);
tipoReporte.addEventListener("change", actualizarFormularioReportes);
periodoReporte.addEventListener("change", actualizarFormularioReportes);

btnGenerarReportePDF.addEventListener("click", generarReportePDF);
btnGenerarReporteExcel.addEventListener("click", generarReporteExcel);

selectorPeriodoResponsable.addEventListener("change", async () => {
  periodoSeleccionadoId = selectorPeriodoResponsable.value;

  detallePrestador.classList.add("hidden");
  await cargarResumenProfesor();
  const vistaActual = document.querySelector(".sidebar-navegacion [data-vista].activo")?.dataset.vista;
  if (vistaActual === "archivados") await cargarPrestadoresArchivados();
  if (vistaActual === "reportes") await cargarPrestadoresParaReportes();
});
btnCerrarPeriodoActual.addEventListener("click", cerrarPeriodoActual);

if (sessionStorage.getItem("responsable_autorizado") === "true") {
  mostrarPanelResponsable();
}

const btnVolverPrestadores = document.getElementById("btnVolverPrestadores");

btnVolverPrestadores.addEventListener("click", () => {
  ocultarHistorialResponsable();

  document.getElementById("vistaPrestadoresResponsable")
    .scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
});

// Inicializar iconos Lucide
if (window.lucide) {
  lucide.createIcons();
}

