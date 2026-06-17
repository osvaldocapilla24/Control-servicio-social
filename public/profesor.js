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

function mostrarPanelResponsable() {
  pinSection.classList.add("hidden");
  panelResponsable.classList.remove("hidden");
  cargarResumenProfesor();
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

function unirDias(dias) {
  if (dias.length === 0) {
    return "";
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
          <button class="btn-mini btn-finalizar-detalle" type="button">
            Finalizar
          </button>

          <button class="btn-mini btn-activar-detalle" type="button">
            Reactivar
          </button>

          <button class="btn-mini-danger btn-borrar-detalle" type="button">
            Limpiar historial
          </button>

          <button class="btn-mini btn-editar-prestador-detalle" type="button">
            Editar datos
          </button>
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

    document.querySelector(".btn-borrar-detalle").addEventListener("click", () => {
      borrarRegistrosPrestador(id, nombre);
    });

    document.querySelector(".btn-editar-prestador-detalle").addEventListener("click", () => {
      mostrarFormularioEditarPrestador(resumen);
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
           class="small-btn btn-editar-responsable"
           data-id="${r.id}"
           data-fecha="${r.fecha}"
           data-entrada="${r.hora_entrada || ""}"
           data-salida="${r.hora_salida || ""}"
           data-actividad="${r.actividad || ""}"
          >
          Editar
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



async function borrarRegistrosPrestador(id, nombre) {
  const confirmar = confirm(
    `¿Seguro que deseas borrar TODOS los registros de ${nombre}?\n\nEsta acción no se puede deshacer.`
  );

  if (!confirmar) {
    return;
  }

  const segundaConfirmacion = confirm(
    "Confirma nuevamente: se eliminarán todas las horas registradas de este prestador."
  );

  if (!segundaConfirmacion) {
    return;
  }

  const respuesta = await fetch(`/api/prestadores/${id}/registros`, {
    method: "DELETE"
  });

  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    alert(resultado.mensaje);
    return;
  }

  alert(`${resultado.mensaje} Registros eliminados: ${resultado.registros_eliminados}`);
  detallePrestador.classList.add("hidden");
  formEditarRegistroResponsable.classList.add("hidden");
  cargarResumenProfesor();
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

if (sessionStorage.getItem("responsable_autorizado") === "true") {
  mostrarPanelResponsable();
}