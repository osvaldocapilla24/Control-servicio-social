const tablaProfesor = document.getElementById("tablaProfesor");

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
        <td>${p.estado_hoy}</td>
      `;

      tablaProfesor.appendChild(tr);
    });

  } catch (error) {
    tablaProfesor.innerHTML = `
      <tr>
        <td colspan="7">Error al cargar la información.</td>
      </tr>
    `;
  }
}

cargarResumenProfesor();