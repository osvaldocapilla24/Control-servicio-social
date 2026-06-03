const prestadorSelect = document.getElementById("prestadorSelect");
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

async function guardarRegistroManual() {
  const prestador_id = prestadorSelect.value;

  if (!prestador_id) {
    mostrarMensaje("Selecciona tu nombre antes de guardar un registro manual.", "error");
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
      prestador_id,
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

  cargarResumen();
}

async function cargarPrestadores() {
  const respuesta = await fetch("/api/prestadores");
  const prestadores = await respuesta.json();

  prestadorSelect.innerHTML = `<option value="">Selecciona tu nombre</option>`;

  prestadores.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.nombre} - ${p.matricula}`;
    prestadorSelect.appendChild(option);
  });
}

async function cargarResumen() {
  const id = prestadorSelect.value;

  if (!id) {
    resumenSection.classList.add("hidden");
    return;
  }

  const respuesta = await fetch(`/api/resumen/${id}`);
  const data = await respuesta.json();

  resumenSection.classList.remove("hidden");

  horasAcumuladas.textContent = Number(data.resumen.horas_acumuladas).toFixed(2);
  horasFaltantes.textContent = Number(data.resumen.horas_faltantes).toFixed(2);
  horarioTexto.textContent = data.resumen.horario;

  tablaRegistros.innerHTML = "";

  data.registros.forEach((r) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${r.fecha}</td>
      <td>${r.hora_entrada || "-"}</td>
      <td>${r.hora_salida || "-"}</td>
      <td>${Number(r.horas).toFixed(2)}</td>
      <td>${r.actividad || "-"}</td>
    `;

    tablaRegistros.appendChild(tr);
  });
}

async function registrarEntrada() {
  const prestador_id = prestadorSelect.value;
  const actividad = actividadInput.value.trim();

  if (!prestador_id) {
    mostrarMensaje("Selecciona tu nombre.", "error");
    return;
  }

  const respuesta = await fetch("/api/entrada", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prestador_id,
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
  cargarResumen();
}

async function registrarSalida() {
  const prestador_id = prestadorSelect.value;

  if (!prestador_id) {
    mostrarMensaje("Selecciona tu nombre.", "error");
    return;
  }

  const respuesta = await fetch("/api/salida", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prestador_id
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

  cargarResumen();
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
}

prestadorSelect.addEventListener("change", cargarResumen);
btnEntrada.addEventListener("click", registrarEntrada);
btnSalida.addEventListener("click", registrarSalida);
btnRegistroManual.addEventListener("click", guardarRegistroManual);

cargarPrestadores();