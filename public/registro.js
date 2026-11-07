const formRegistro = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

const tituloRegistro = document.getElementById("tituloRegistro");
const descripcionRegistro = document.getElementById("descripcionRegistro");
const btnRegistrarPrestador = document.getElementById("btnRegistrarPrestador");
const btnYaRegistrado = document.getElementById("linkYaRegistrado");
const btnVolverRegistro = document.getElementById("btnVolverRegistro");
const periodoServicio = document.getElementById("periodoServicio");

let periodosDisponibles = [];

const anioActual = new Date().getFullYear();
const anioMinimo = 2020;
const anioMaximo = anioActual + 30;

async function cargarPeriodoActualEnRegistro() {
  periodoServicio.innerHTML =
    '<option value="">Cargando periodos disponibles...</option>';

  periodoServicio.disabled = true;
  periodosDisponibles = [];

  try {
    const respuesta = await fetch("/api/periodos");
    const periodos = await respuesta.json();

    if (!respuesta.ok || !Array.isArray(periodos)) {
      throw new Error("No se pudieron cargar los periodos.");
    }

    periodosDisponibles = periodos.filter(
      (periodo) => periodo.estatus === "activo",
    );

    periodoServicio.innerHTML = "";

    if (periodosDisponibles.length === 0) {
      periodoServicio.innerHTML =
        '<option value="">No hay periodos disponibles</option>';
      return;
    }

    periodosDisponibles.forEach((periodo) => {
      const opcion = document.createElement("option");

      opcion.value = String(periodo.id);
      opcion.textContent = `${periodo.nombre} ${periodo.anio}`;

      if (periodo.es_actual) {
        opcion.textContent += " · Actual";
      }

      periodoServicio.appendChild(opcion);
    });

    const periodoActual = periodosDisponibles.find(
      (periodo) => periodo.es_actual,
    );

    if (periodoActual) {
      periodoServicio.value = String(periodoActual.id);
    }

    periodoServicio.disabled = false;
  } catch (error) {
    periodoServicio.innerHTML =
      '<option value="">Error al cargar periodos</option>';
  } finally {
    periodoServicio.dispatchEvent(new Event("change"));
  }
}

cargarPeriodoActualEnRegistro();

const parametros = new URLSearchParams(window.location.search);
const origen = parametros.get("origen");

if (origen === "responsable") {
  tituloRegistro.textContent = "Alta de Prestador";

  descripcionRegistro.textContent =
    "Registra los datos del nuevo prestador para que pueda ingresar después con su matrícula.";

  btnRegistrarPrestador.textContent = "Registrar prestador";

  if (btnYaRegistrado) {
    btnYaRegistrado.style.display = "none";
  }

  btnVolverRegistro.textContent = "Regresar al panel";
} else {
  btnVolverRegistro.textContent = "Regresar al inicio";
}

btnVolverRegistro.addEventListener("click", () => {
  if (origen === "responsable") {
    window.location.href = "profesor.html";
  } else {
    window.location.href = "index.html";
  }
});

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
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

function validarRegistroPrestador(datos) {
  if (!datos.nombre) {
    return "El nombre es obligatorio.";
  }

  if (!datos.matricula) {
    return "La matrícula es obligatoria.";
  }

  if (!datos.carrera) {
    return "La carrera es obligatoria.";
  }

  if (!datos.horario) {
    return "El horario es obligatorio.";
  }

  if (!datos.periodo) {
    return "El periodo de servicio social es obligatorio.";
  }

  if (!datos.anio_periodo) {
    return "El año del periodo es obligatorio.";
  }

  if (
    !Number.isInteger(datos.anio_periodo) ||
    datos.anio_periodo < anioMinimo ||
    datos.anio_periodo > anioMaximo
  ) {
    return `El año del periodo debe estar entre ${anioMinimo} y ${anioMaximo}.`;
  }

  if (!datos.horas_requeridas || datos.horas_requeridas <= 0) {
    return "Las horas requeridas deben ser mayor a 0.";
  }

  return null;
}

formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const diasSeleccionados = Array.from(
    document.querySelectorAll("input[name='diasServicio']:checked"),
  ).map((dia) => dia.value);

  const horaEntradaServicio = document.getElementById(
    "horaEntradaServicio",
  ).value;
  const horaSalidaServicio =
    document.getElementById("horaSalidaServicio").value;

  if (diasSeleccionados.length === 0) {
    mostrarMensaje("Selecciona al menos un día de servicio.", "error");
    return;
  }

  if (!horaEntradaServicio) {
    mostrarMensaje("La hora de entrada es obligatoria.", "error");
    return;
  }

  if (!horaSalidaServicio) {
    mostrarMensaje("La hora de salida es obligatoria.", "error");
    return;
  }

  if (horaSalidaServicio <= horaEntradaServicio) {
    mostrarMensaje(
      "La hora de salida debe ser mayor que la hora de entrada.",
      "error",
    );
    return;
  }

  const horarioArmado = armarHorario(
    diasSeleccionados,
    horaEntradaServicio,
    horaSalidaServicio,
  );

  const periodoSeleccionado = periodosDisponibles.find(
    (periodo) => String(periodo.id) === periodoServicio.value,
  );

  if (!periodoSeleccionado) {
    mostrarMensaje("Debes seleccionar un periodo disponible.", "error");
    return;
  }

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    carrera: document.getElementById("carrera").value.trim(),
    horario: horarioArmado,
    periodo: periodoSeleccionado.nombre,
    anio_periodo: Number(periodoSeleccionado.anio),
    horas_requeridas: Number(document.getElementById("horas_requeridas").value),
  };

  const errorValidacion = validarRegistroPrestador(datos);

  if (errorValidacion) {
    mostrarMensaje(errorValidacion, "error");
    return;
  }

  try {
    const respuesta = await fetch("/api/prestadores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(resultado.mensaje, "error");
      return;
    }

    mostrarMensaje(resultado.mensaje, "success");

    formRegistro.reset();
    document.getElementById("horas_requeridas").value = 480;
    document.getElementById("carrera").value = "";

    await cargarPeriodoActualEnRegistro();

    setTimeout(() => {
      if (
        origen === "responsable" &&
        sessionStorage.getItem("responsable_autorizado") === "true"
      ) {
        window.location.href = "profesor.html";
      } else {
        window.location.href = "index.html";
      }
    }, 1500);
  } catch (error) {
    mostrarMensaje("Error al conectar con el servidor.", "error");
  }
});
