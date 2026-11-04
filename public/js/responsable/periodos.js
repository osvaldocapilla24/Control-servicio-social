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