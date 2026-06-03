const formAcceso = document.getElementById("formAcceso");
const busquedaPrestador = document.getElementById("busquedaPrestador");
const mensajeAcceso = document.getElementById("mensajeAcceso");

formAcceso.addEventListener("submit", (e) => {
  e.preventDefault();

  const texto = busquedaPrestador.value.trim();

  if (!texto) {
    mensajeAcceso.textContent = "Escribe tu nombre o matrícula para continuar.";
    mensajeAcceso.className = "mensaje error";
    return;
  }

  mensajeAcceso.textContent = "En la siguiente tarea conectaremos esta búsqueda con la base de datos.";
  mensajeAcceso.className = "mensaje success";

  setTimeout(() => {
    window.location.href = "panel.html";
  }, 1000);
});