const formRegistro = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

const tituloRegistro = document.getElementById("tituloRegistro");
const descripcionRegistro = document.getElementById("descripcionRegistro");
const btnRegistrarPrestador = document.getElementById("btnRegistrarPrestador");
const btnYaRegistrado = document.getElementById("btnYaRegistrado");

const parametros = new URLSearchParams(window.location.search);
const origen = parametros.get("origen");

if (origen === "responsable") {
  tituloRegistro.textContent = "Alta de Prestador";

  descripcionRegistro.textContent =
    "Registra los datos del nuevo prestador para que pueda ingresar después con su matrícula.";

  btnRegistrarPrestador.textContent = "Registrar prestador";

  btnYaRegistrado.classList.add("hidden");
}

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo}`;
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

  if (!datos.horas_requeridas || datos.horas_requeridas <= 0) {
    return "Las horas requeridas deben ser mayor a 0.";
  }

  return null;
}

formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    carrera: document.getElementById("carrera").value.trim(),
    horario: document.getElementById("horario").value.trim(),
    horas_requeridas: Number(document.getElementById("horas_requeridas").value)
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(datos)
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(resultado.mensaje, "error");
      return;
    }

    mostrarMensaje(resultado.mensaje, "success");

    formRegistro.reset();
    document.getElementById("horas_requeridas").value = 480;
    document.getElementById("carrera").value = "Ingeniería en Tecnologías de la Información";

   setTimeout(() => {
  const parametros = new URLSearchParams(window.location.search);
  const origen = parametros.get("origen");

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