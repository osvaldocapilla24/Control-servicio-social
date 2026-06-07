const formAcceso = document.getElementById("formAcceso");
const busquedaPrestador = document.getElementById("busquedaPrestador");
const mensajeAcceso = document.getElementById("mensajeAcceso");

formAcceso.addEventListener("submit", async (e) => {
  e.preventDefault();

  const texto = busquedaPrestador.value.trim();

  if (!texto) {
    mensajeAcceso.textContent = "Escribe tu nombre o matrícula para continuar.";
    mensajeAcceso.className = "mensaje error";
    return;
  }

  try {
    const respuesta = await fetch(`/api/prestadores/buscar/${encodeURIComponent(texto)}`);
    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      mensajeAcceso.textContent = resultado.mensaje;
      mensajeAcceso.className = "mensaje error";
      return;
    }

    const prestador = resultado.prestador;

    sessionStorage.setItem("prestador_id", prestador.id);
    sessionStorage.setItem("prestador_nombre", prestador.nombre);

    mensajeAcceso.textContent = `Bienvenido, ${prestador.nombre}.`;
    mensajeAcceso.className = "mensaje success";

    setTimeout(() => {
      window.location.href = "panel.html";
    }, 1000);

  } catch (error) {
    mensajeAcceso.textContent = "Error al conectar con el servidor.";
    mensajeAcceso.className = "mensaje error";
  }
});