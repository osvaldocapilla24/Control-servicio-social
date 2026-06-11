sessionStorage.removeItem("responsable_autorizado");
sessionStorage.removeItem("prestador_id");
sessionStorage.removeItem("prestador_nombre");
sessionStorage.removeItem("prestador_estatus");

const formAcceso = document.getElementById("formAcceso");
const busquedaPrestador = document.getElementById("busquedaPrestador");
const mensajeAcceso = document.getElementById("mensajeAcceso");

let temporizadorMensaje;

function mostrarMensaje(texto, tipo) {
  mensajeAcceso.textContent = texto;
  mensajeAcceso.className = `mensaje ${tipo}`;

  clearTimeout(temporizadorMensaje);

  temporizadorMensaje = setTimeout(() => {
    mensajeAcceso.textContent = "";
    mensajeAcceso.className = "mensaje";
  }, 4000);
}

formAcceso.addEventListener("submit", async (e) => {
  e.preventDefault();

  const texto = busquedaPrestador.value.trim();

  if (!texto) {
    mostrarMensaje("Escribe tu nombre o matrícula para continuar.", "error");
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/buscar/${encodeURIComponent(texto)}`);
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mostrarMensaje(resultado.mensaje, "error");
      return;
    }

    const prestador = resultado.prestador;

    sessionStorage.setItem("prestador_id", prestador.id);
    sessionStorage.setItem("prestador_nombre", prestador.nombre);
    sessionStorage.setItem("prestador_estatus", prestador.estatus || "activo");

    if (prestador.estatus === "finalizado") {
      mensajeAcceso.textContent = `Bienvenido, ${prestador.nombre}. Tu servicio está marcado como finalizado.`;
      mensajeAcceso.className = "mensaje success";
    } else {
      mensajeAcceso.textContent = `Bienvenido, ${prestador.nombre}.`;
      mensajeAcceso.className = "mensaje success";
    }

    setTimeout(() => {
      window.location.href = "panel.html";
    }, 1000);

  } catch (error) {
    mostrarMensaje("Error al conectar con el servidor.", "error");
  }
});