async function cargarResumenProfesor() {
    try {
        const url = periodoSeleccionadoId
            ? `/api/profesor/resumen?periodo_id=${periodoSeleccionadoId}`
            : "/api/profesor/resumen";

        const respuesta = await fetch(url);
        const datos = await respuesta.json();

        if (!respuesta.ok) {
            tablaProfesor.innerHTML = `
        <tr>
          <td colspan="9">${datos.mensaje || "Error al cargar la información."}</td>
        </tr>
      `;
            return;
        }

        const prestadores = datos.prestadores || [];

        tablaProfesor.innerHTML = "";

        if (prestadores.length === 0) {
            tablaProfesor.innerHTML = `
        <tr>
          <td colspan="9">No hay prestadores registrados en este periodo.</td>
        </tr>
      `;
            return;
        }

        prestadores.forEach((p) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
    <td data-label="Nombre">${p.nombre}</td>
    <td data-label="Matrícula">${p.matricula}</td>
    <td data-label="Carrera">${p.carrera}</td>
    <td data-label="Horario">${p.horario}</td>
    <td data-label="Horas acumuladas">${Number(p.horas_acumuladas).toFixed(2)}</td>
    <td data-label="Horas faltantes">${Number(p.horas_faltantes).toFixed(2)}</td>
    <td data-label="Estatus">${p.estatus || "activo"}</td>
    <td data-label="Estado de hoy">${p.estado_hoy}</td>
    <td data-label="Acciones">
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
                ocultarSeccionesResponsable();

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

async function verHistorial(id, nombre, desplazar = true) {
    try {
        const respuestaHistorial = await fetch(
            `/api/profesor/prestador/${id}/registros`,
        );
        const registros = await respuestaHistorial.json();

        const respuestaResumen = await fetch(`/api/resumen/${id}`);
        const dataResumen = await respuestaResumen.json();

        const resumen = dataResumen.resumen;
        const datosHorario = obtenerDatosHorario(resumen.horario);

        detallePrestador.classList.remove("hidden");

        // Ocultar la lista general mientras se consulta el historial
        const contenedorTabla = tablaProfesor.closest(".tabla-scroll-responsable");

        if (contenedorTabla) {
            contenedorTabla.classList.add("hidden");
        }

        if (desplazar) {
            setTimeout(() => {
                detallePrestador.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 100);
        }

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
          <strong>Menú Prestador</strong>
        </div>

        <div class="acciones-historial-botones">
          <button class="btn-mini btn-editar-prestador-detalle" type="button">
            Editar datos
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
    <option value="Administración">
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

    <label class="label-seccion">Periodo de servicio social</label>

      <div class="periodo-servicio-grid">
        <div class="campo-periodo">
          <label for="editarPeriodoServicio">Periodo</label>
          <select id="editarPeriodoServicio">
            <option value="Primavera">Primavera</option>
            <option value="Verano">Verano</option>
            <option value="Otoño">Otoño</option>
          </select>
        </div>

        <div class="campo-anio">
          <label for="editarAnioPeriodoServicio">Año</label>
          <input type="number" id="editarAnioPeriodoServicio">
        </div>
      </div>

      <label for="editarHorasRequeridasPrestador">Horas requeridas</label>
      <input type="number" id="editarHorasRequeridasPrestador" value="${Number(resumen.horas_requeridas)}">

      <div class="buttons">
        <button type="button" id="btnGuardarPrestadorEditado">
          Guardar cambios
        </button>

        <button
            type="button"
            id="btnCancelarPrestadorEditado"
            class="secondary-btn btn-cancelar-edicion"
            >
            Cancelar
        </button>
      </div>
    </div>
        `;

        document
            .querySelector(".btn-finalizar-detalle")
            .addEventListener("click", () => {
                finalizarPrestador(id);
            });

        document
            .querySelector(".btn-activar-detalle")
            .addEventListener("click", () => {
                activarPrestador(id);
            });

        document
            .querySelector(".btn-archivar-detalle")
            .addEventListener("click", () => {
                archivarPrestador(id, nombre);
            });

        document
            .querySelector(".btn-editar-prestador-detalle")
            .addEventListener("click", () => {
                mostrarFormularioEditarPrestador(resumen);
            });

        document
            .getElementById("btnGuardarPrestadorEditado")
            .addEventListener("click", () => {
                guardarDatosPrestadorEditado(id);
            });

        document
            .getElementById("btnCancelarPrestadorEditado")
            .addEventListener("click", () => {
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
        <td data-label="Fecha">${r.fecha}</td>
        <td data-label="Entrada">${r.hora_entrada || "-"}</td>
        <td data-label="Salida">${r.hora_salida || "-"}</td>
        <td data-label="Horas">${Number(r.horas).toFixed(2)}</td>
        <td data-label="Actividad">${r.actividad || "-"}</td>
        <td data-label="Acciones">
          <div class="acciones-registro">
            <button
              class="icon-btn btn-editar-responsable"
              type="button"
              title="Editar registro"
              aria-label="Editar registro"
              data-id="${r.id}"
              data-fecha="${r.fecha}"
              data-entrada="${r.hora_entrada || ""}"
              data-salida="${r.hora_salida || ""}"
              data-actividad="${r.actividad || ""}"
            >
              <i data-lucide="pencil"></i>
            </button>

            <button
              class="icon-btn btn-eliminar-responsable"
              type="button"
              title="Eliminar registro"
              aria-label="Eliminar registro"
              data-id="${r.id}"
            >
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      `;

            tablaHistorial.appendChild(tr);
        });

        activarBotonesHistorialResponsable();
        if (window.lucide) {
            lucide.createIcons();
        }

    } catch (error) {
        tablaHistorial.innerHTML = `
      <tr>
        <td colspan="6">Error al cargar historial.</td>
      </tr>
    `;
    }
}

function unirDias(dias) {
    if (dias.length === 0) {
        return "";
    }

    const ordenDias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
    ];

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

    const ordenDias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
    ];

    const partes = horario.split(" de ");

    if (partes.length === 2) {
        const diasTexto = partes[0].trim();
        const horasTexto = partes[1].trim();

        if (diasTexto.includes(" a ")) {
            const partesDias = diasTexto.split(" a ");
            const diaInicio = partesDias[0].trim();
            const diaFin = partesDias[1].trim();

            const indiceInicio = ordenDias.indexOf(diaInicio);
            const indiceFin = ordenDias.indexOf(diaFin);

            if (
                indiceInicio !== -1 &&
                indiceFin !== -1 &&
                indiceInicio <= indiceFin
            ) {
                for (let i = indiceInicio; i <= indiceFin; i++) {
                    dias.push(ordenDias[i]);
                }
            }
        } else {
            ordenDias.forEach((dia) => {
                if (diasTexto.includes(dia)) {
                    dias.push(dia);
                }
            });
        }

        const horas = horasTexto.split(" a ");

        if (horas.length === 2) {
            horaEntrada = horas[0].trim();
            horaSalida = horas[1].trim();
        }
    }

    return { dias, horaEntrada, horaSalida };
}

function mostrarFormularioEditarPrestador(resumen) {
    const formEditarPrestador = document.getElementById("formEditarPrestador");

    document.getElementById("editarNombrePrestador").value = resumen.nombre;
    document.getElementById("editarMatriculaPrestador").value = resumen.matricula;
    document.getElementById("editarCarreraPrestador").value = resumen.carrera;
    document.getElementById("editarHorasRequeridasPrestador").value = Number(
        resumen.horas_requeridas,
    );
    const editarPeriodoServicio = document.getElementById(
        "editarPeriodoServicio",
    );
    const editarAnioPeriodoServicio = document.getElementById(
        "editarAnioPeriodoServicio",
    );

    const anioActualEditar = new Date().getFullYear();
    const anioMinimoEditar = 2020;
    const anioMaximoEditar = anioActualEditar + 30;

    editarAnioPeriodoServicio.min = anioMinimoEditar;
    editarAnioPeriodoServicio.max = anioMaximoEditar;

    editarPeriodoServicio.value = resumen.periodo || "Verano";
    editarAnioPeriodoServicio.value = resumen.anio_periodo || anioActualEditar;

    const datosHorario = obtenerDatosHorario(resumen.horario);

    document
        .querySelectorAll("input[name='editarDiasServicio']")
        .forEach((checkbox) => {
            checkbox.checked = datosHorario.dias.includes(checkbox.value);
        });

    document.getElementById("editarHoraEntradaServicio").value =
        datosHorario.horaEntrada;
    document.getElementById("editarHoraSalidaServicio").value =
        datosHorario.horaSalida;

    formEditarPrestador.classList.remove("hidden");
    formEditarPrestador.scrollIntoView({ behavior: "smooth" });
}

async function guardarDatosPrestadorEditado(id) {
    const diasSeleccionados = Array.from(
        document.querySelectorAll("input[name='editarDiasServicio']:checked"),
    ).map((dia) => dia.value);

    const horaEntradaServicio = document.getElementById(
        "editarHoraEntradaServicio",
    ).value;
    const horaSalidaServicio = document.getElementById(
        "editarHoraSalidaServicio",
    ).value;

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
        horaSalidaServicio,
    );

    const datos = {
        nombre: document.getElementById("editarNombrePrestador").value.trim(),
        matricula: document.getElementById("editarMatriculaPrestador").value.trim(),
        carrera: document.getElementById("editarCarreraPrestador").value.trim(),
        horario: horarioArmado,
        periodo: document.getElementById("editarPeriodoServicio").value,
        anio_periodo: Number(
            document.getElementById("editarAnioPeriodoServicio").value,
        ),
        horas_requeridas: Number(
            document.getElementById("editarHorasRequeridasPrestador").value,
        ),
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

    const anioActual = new Date().getFullYear();
    const anioMinimo = 2020;
    const anioMaximo = anioActual + 30;

    if (!datos.periodo) {
        alert("El periodo de servicio social es obligatorio.");
        return;
    }

    if (
        !Number.isInteger(datos.anio_periodo) ||
        datos.anio_periodo < anioMinimo ||
        datos.anio_periodo > anioMaximo
    ) {
        alert(`El año del periodo debe estar entre ${anioMinimo} y ${anioMaximo}.`);
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
                "Content-Type": "application/json",
            },
            body: JSON.stringify(datos),
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            alert(resultado.mensaje);
            return;
        }

        alert(resultado.mensaje);

        document.getElementById("formEditarPrestador").classList.add("hidden");

        prestadorResponsableEditandoNombre.value = datos.nombre;

        /*
          Recargamos los periodos para que aparezca el nuevo periodo
          sin tener que refrescar la página.
        */
        await cargarPeriodosResponsable();

        const opcionPeriodoEditado = Array.from(
            selectorPeriodoResponsable.options,
        ).find((option) => {
            return (
                option.textContent.trim() === `${datos.periodo} ${datos.anio_periodo}`
            );
        });

        if (opcionPeriodoEditado) {
            periodoSeleccionadoId = opcionPeriodoEditado.value;
            selectorPeriodoResponsable.value = opcionPeriodoEditado.value;
        }

        /*
          Cerramos el historial para que después de guardar no se quede abierto.
        */
        detallePrestador.classList.add("hidden");
        formEditarRegistroResponsable.classList.add("hidden");
        tablaHistorial.innerHTML = "";
        nombreDetalle.innerHTML = "";

        prestadorResponsableEditandoId.value = "";
        prestadorResponsableEditandoNombre.value = "";

        limpiarFormularioEdicionResponsable();
       
        await cargarResumenProfesor();
        await verHistorial(id, datos.nombre, false);
        document.getElementById("formEditarPrestador").classList.add("hidden");
    }
    catch (error) {
        alert("Error al conectar con el servidor.");
    }
}

async function finalizarPrestador(id) {
  const confirmar = confirm(
    "¿Seguro que deseas marcar este prestador como finalizado?",
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/finalizar`, {
      method: "PATCH",
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
      method: "PATCH",
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
    "Podrás consultarlo y restaurarlo después desde la sección Archivados."
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/archivar`, {
      method: "PATCH",
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      alert(resultado.mensaje);
      return;
    }

    alert(resultado.mensaje);

    // Cerrar el historial y recuperar la tabla general
    ocultarHistorialResponsable();

    // Actualizar la lista de prestadores
    await cargarResumenProfesor();

    // Actualizar Archivados si su sección está visible
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
    "Volverá a aparecer en la tabla principal del responsable con estado activo.",
  );

  if (!confirmar) {
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/${id}/activar`, {
      method: "PATCH",
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
