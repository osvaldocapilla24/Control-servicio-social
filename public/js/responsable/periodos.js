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

// Registro de nuevos periodos desde el panel del responsable.

const formNuevoPeriodo = document.getElementById("formNuevoPeriodo");
const nuevoPeriodoNombre = document.getElementById("nuevoPeriodoNombre");
const nuevoPeriodoAnio = document.getElementById("nuevoPeriodoAnio");
const mensajeNuevoPeriodo = document.getElementById("mensajeNuevoPeriodo");

if (formNuevoPeriodo) {
  nuevoPeriodoAnio.value = new Date().getFullYear();

  formNuevoPeriodo.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nombre = nuevoPeriodoNombre.value;
    const anio = Number(nuevoPeriodoAnio.value);
    const boton = formNuevoPeriodo.querySelector('button[type="submit"]');

    if (!nombre || !Number.isInteger(anio) || anio < 2020 || anio > 2100) {
      mensajeNuevoPeriodo.textContent = "Selecciona un periodo y un año válido.";
      mensajeNuevoPeriodo.style.color = "#dc2626";
      return;
    }

    boton.disabled = true;
    mensajeNuevoPeriodo.textContent = "Guardando periodo...";
    mensajeNuevoPeriodo.style.color = "#526176";

    try {
      const respuesta = await fetch("/api/periodos/obtener-o-crear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: nombre,
          anio: anio
        })
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo registrar el periodo.");
      }

      mensajeNuevoPeriodo.textContent =
        `Periodo ${resultado.periodo.nombre} ${resultado.periodo.anio} disponible en el sistema.`;

      mensajeNuevoPeriodo.style.color = "#15803d";

      formNuevoPeriodo.reset();
      nuevoPeriodoAnio.value = new Date().getFullYear();

      // Actualizar los periodos del panel.
      await cargarPeriodosResponsable();

    } catch (error) {
      mensajeNuevoPeriodo.textContent = error.message;
      mensajeNuevoPeriodo.style.color = "#dc2626";
    } finally {
      boton.disabled = false;
    }
  });
}

