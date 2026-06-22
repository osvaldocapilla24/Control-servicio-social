const nombrePrestadorPanel = document.getElementById("nombrePrestadorPanel");
const actividadInput = document.getElementById("actividad");
const btnEntrada = document.getElementById("btnEntrada");
const btnSalida = document.getElementById("btnSalida");
const mensaje = document.getElementById("mensaje");

const resumenSection = document.getElementById("resumen");
const horasAcumuladas = document.getElementById("horasAcumuladas");
const horasFaltantes = document.getElementById("horasFaltantes");
const horarioTexto = document.getElementById("horarioTexto");
const tablaRegistros = document.getElementById("tablaRegistros");

const fechaManual = document.getElementById("fechaManual");
const entradaManual = document.getElementById("entradaManual");
const salidaManual = document.getElementById("salidaManual");
const actividadManual = document.getElementById("actividadManual");
const btnRegistroManual = document.getElementById("btnRegistroManual");

const formEditarRegistro = document.getElementById("formEditarRegistro");
const registroEditandoId = document.getElementById("registroEditandoId");
const editarFecha = document.getElementById("editarFecha");
const editarEntrada = document.getElementById("editarEntrada");
const editarSalida = document.getElementById("editarSalida");
const editarActividad = document.getElementById("editarActividad");
const btnGuardarEdicion = document.getElementById("btnGuardarEdicion");
const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");

const btnVerHistorialCompleto = document.getElementById("btnVerHistorialCompleto");
const btnOcultarHistorialCompleto = document.getElementById("btnOcultarHistorialCompleto");
const historialCompletoSection = document.getElementById("historialCompletoSection");
const tablaHistorialCompletoPrestador = document.getElementById("tablaHistorialCompletoPrestador");

const prestadorIdActual = sessionStorage.getItem("prestador_id");
const prestadorNombreActual = sessionStorage.getItem("prestador_nombre");
const bloqueRegistroDia = document.getElementById("bloqueRegistroDia");
const bloqueRegistroManual = document.getElementById("bloqueRegistroManual");
const avisoEstatusPrestador = document.getElementById("avisoEstatusPrestador");
const etiquetaEstatusPrestador = document.getElementById("etiquetaEstatusPrestador");
const tituloAvisoEstatus = document.getElementById("tituloAvisoEstatus");
const textoAvisoEstatus = document.getElementById("textoAvisoEstatus");

async function cargarResumen() {
  if (!prestadorIdActual) {
    window.location.href = "index.html";
    return;
  }

  const respuesta = await fetch(`/api/resumen/${prestadorIdActual}`);
  const data = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(data.mensaje || "Error al cargar resumen.", "error");
    return;
  }

  resumenSection.classList.remove("hidden");

  horasAcumuladas.textContent = Number(data.resumen.horas_acumuladas).toFixed(2);
  horasFaltantes.textContent = Number(data.resumen.horas_faltantes).toFixed(2);
  horarioTexto.textContent = data.resumen.horario;
 
  aplicarVistaPorEstatus(data.resumen.estatus);

  tablaRegistros.innerHTML = "";

  if (data.registros.length === 0) {
    tablaRegistros.innerHTML = `
      <tr>
        <td colspan="6">Todavía no tienes registros.</td>
      </tr>
    `;
    return;
  }

  data.registros.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.fecha}</td>
      <td>${r.hora_entrada || "-"}</td>
      <td>${r.hora_salida || "-"}</td>
      <td>${Number(r.horas).toFixed(2)}</td>
      <td>${r.actividad || "-"}</td>
      <td>
        <button 
          class="icon-btn btn-editar-registro"
          title="Editar registro"
          data-id="${r.id}"
          data-fecha="${r.fecha}"
          data-entrada="${r.hora_entrada || ""}"
          data-salida="${r.hora_salida || ""}"
          data-actividad="${r.actividad || ""}"
          >
          ✏️
        </button>

        <button 
          class="icon-btn danger-icon btn-eliminar-registro"
          title="Eliminar registro"
          data-id="${r.id}"
        >
          🗑️
        </button>
      </td>
    `;

    tablaRegistros.appendChild(tr);
  });

  activarBotonesRegistros();
}


function aplicarVistaPorEstatus(estatus) {
  const estaFinalizado = estatus === "finalizado";
  const estaArchivado = estatus === "archivado";
  const estaBloqueado = estaFinalizado || estaArchivado;

  btnEntrada.disabled = estaBloqueado;
  btnSalida.disabled = estaBloqueado;
  btnRegistroManual.disabled = estaBloqueado;

  actividadInput.disabled = estaBloqueado;
  fechaManual.disabled = estaBloqueado;
  entradaManual.disabled = estaBloqueado;
  salidaManual.disabled = estaBloqueado;
  actividadManual.disabled = estaBloqueado;

  if (!estaBloqueado) {
    avisoEstatusPrestador.classList.add("hidden");
    bloqueRegistroDia.classList.remove("hidden");
    bloqueRegistroManual.classList.remove("hidden");
    return;
  }

  avisoEstatusPrestador.classList.remove("hidden");
  bloqueRegistroDia.classList.add("hidden");
  bloqueRegistroManual.classList.add("hidden");
  formEditarRegistro.classList.add("hidden");

  if (estaFinalizado) {
    etiquetaEstatusPrestador.textContent = "Finalizado";
    tituloAvisoEstatus.textContent = "Servicio social finalizado";
    textoAvisoEstatus.textContent =
      "Este prestador ya fue marcado como finalizado por el responsable. Puede consultar su resumen e historial, pero ya no puede registrar nuevas horas.";
  }

  if (estaArchivado) {
    etiquetaEstatusPrestador.textContent = "Archivado";
    tituloAvisoEstatus.textContent = "Prestador archivado";
    textoAvisoEstatus.textContent =
      "Este prestador se encuentra archivado. Sus registros se conservan como historial, pero ya no puede usar el panel de registro.";
  }
}

async function cargarHistorialCompleto() {
  if (!prestadorIdActual) {
    mostrarMensaje("No se encontró el prestador actual.", "error");
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${prestadorIdActual}/registros`);
    const registros = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(registros.mensaje || "Error al cargar historial completo.", "error");
      return;
    }

    tablaHistorialCompletoPrestador.innerHTML = "";

    if (registros.length === 0) {
      tablaHistorialCompletoPrestador.innerHTML = `
        <tr>
          <td colspan="5">Todavía no tienes registros guardados.</td>
        </tr>
      `;
    } else {
      registros.forEach((r) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${r.fecha}</td>
          <td>${r.hora_entrada || "-"}</td>
          <td>${r.hora_salida || "-"}</td>
          <td>${Number(r.horas).toFixed(2)}</td>
          <td>${r.actividad || "-"}</td>
        `;

        tablaHistorialCompletoPrestador.appendChild(tr);
      });
    }

    historialCompletoSection.classList.remove("hidden");
    historialCompletoSection.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    mostrarMensaje("Error al conectar con el servidor.", "error");
  }
}

function ocultarHistorialCompleto() {
  historialCompletoSection.classList.add("hidden");
}

function activarBotonesRegistros() {
  const botonesEditar = document.querySelectorAll(".btn-editar-registro");
  const botonesEliminar = document.querySelectorAll(".btn-eliminar-registro");

  botonesEditar.forEach((boton) => {
    boton.addEventListener("click", () => {
      registroEditandoId.value = boton.dataset.id;
      editarFecha.value = boton.dataset.fecha;
      editarEntrada.value = boton.dataset.entrada;
      editarSalida.value = boton.dataset.salida;
      editarActividad.value = boton.dataset.actividad;

      formEditarRegistro.classList.remove("hidden");
      formEditarRegistro.scrollIntoView({ behavior: "smooth" });
    });
  });

  botonesEliminar.forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarRegistro(boton.dataset.id);
    });
  });
}

async function registrarEntrada() {
  if (!prestadorIdActual) {
    mostrarMensaje("No se encontró el prestador actual.", "error");
    return;
  }

  const actividad = actividadInput.value.trim();

  const respuesta = await fetch("/api/entrada", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prestador_id: prestadorIdActual,
      actividad
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(resultado.mensaje, "error");
    return;
  }

  mostrarMensaje(`${resultado.mensaje} Hora: ${resultado.hora_entrada}`, "success");
  actividadInput.value = "";

  await cargarResumen();

  if (!historialCompletoSection.classList.contains("hidden")) {
    await cargarHistorialCompleto();
  }
}

async function registrarSalida() {
  if (!prestadorIdActual) {
    mostrarMensaje("No se encontró el prestador actual.", "error");
    return;
  }

  const respuesta = await fetch("/api/salida", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prestador_id: prestadorIdActual
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(resultado.mensaje, "error");
    return;
  }

  mostrarMensaje(
    `${resultado.mensaje} Hora: ${resultado.hora_salida}. Horas: ${Number(resultado.horas).toFixed(2)}`,
    "success"
  );

  await cargarResumen();

  if (!historialCompletoSection.classList.contains("hidden")) {
    await cargarHistorialCompleto();
  }
}

async function guardarRegistroManual() {
  if (!prestadorIdActual) {
    mostrarMensaje("No se encontró el prestador actual.", "error");
    return;
  }

  if (!fechaManual.value || !entradaManual.value || !salidaManual.value) {
    mostrarMensaje("Completa fecha, hora de entrada y hora de salida.", "error");
    return;
  }

  const respuesta = await fetch("/api/registro-manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prestador_id: prestadorIdActual,
      fecha: fechaManual.value,
      hora_entrada: entradaManual.value,
      hora_salida: salidaManual.value,
      actividad: actividadManual.value.trim()
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(resultado.mensaje, "error");
    return;
  }

  mostrarMensaje(
    `${resultado.mensaje} Horas agregadas: ${Number(resultado.horas).toFixed(2)}`,
    "success"
  );

  fechaManual.value = "";
  entradaManual.value = "";
  salidaManual.value = "";
  actividadManual.value = "";

  await cargarResumen();

  if (!historialCompletoSection.classList.contains("hidden")) {
    await cargarHistorialCompleto();
  }
}

async function guardarEdicionRegistro() {
  const id = registroEditandoId.value;

  if (!id) {
    mostrarMensaje("No hay ningún registro seleccionado para editar.", "error");
    return;
  }

  if (!editarFecha.value || !editarEntrada.value || !editarSalida.value) {
    mostrarMensaje("Completa fecha, hora de entrada y hora de salida.", "error");
    return;
  }

  const respuesta = await fetch(`/api/registros/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fecha: editarFecha.value,
      hora_entrada: editarEntrada.value,
      hora_salida: editarSalida.value,
      actividad: editarActividad.value.trim()
    })
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(resultado.mensaje, "error");
    return;
  }

  mostrarMensaje(resultado.mensaje, "success");
  limpiarFormularioEdicion();

  await cargarResumen();

  if (!historialCompletoSection.classList.contains("hidden")) {
    await cargarHistorialCompleto();
  }
}

async function eliminarRegistro(id) {
  const confirmar = confirm("¿Seguro que deseas eliminar este registro?");

  if (!confirmar) {
    return;
  }

  const respuesta = await fetch(`/api/registros/${id}`, {
    method: "DELETE"
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    mostrarMensaje(resultado.mensaje, "error");
    return;
  }

  mostrarMensaje(resultado.mensaje, "success");

  await cargarResumen();

  if (!historialCompletoSection.classList.contains("hidden")) {
    await cargarHistorialCompleto();
  }
}

function limpiarFormularioEdicion() {
  registroEditandoId.value = "";
  editarFecha.value = "";
  editarEntrada.value = "";
  editarSalida.value = "";
  editarActividad.value = "";
  formEditarRegistro.classList.add("hidden");
}

let temporizadorMensaje;

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;

  clearTimeout(temporizadorMensaje);

  temporizadorMensaje = setTimeout(() => {
    mensaje.textContent = "";
    mensaje.className = "mensaje";
  }, 4000);
}

btnEntrada.addEventListener("click", registrarEntrada);
btnSalida.addEventListener("click", registrarSalida);
btnRegistroManual.addEventListener("click", guardarRegistroManual);
btnGuardarEdicion.addEventListener("click", guardarEdicionRegistro);
btnCancelarEdicion.addEventListener("click", limpiarFormularioEdicion);
btnVerHistorialCompleto.addEventListener("click", cargarHistorialCompleto);
btnOcultarHistorialCompleto.addEventListener("click", ocultarHistorialCompleto);

if (!prestadorIdActual) {
  window.location.href = "index.html";
} else {
  nombrePrestadorPanel.textContent = prestadorNombreActual || "Prestador";
  cargarResumen();
}