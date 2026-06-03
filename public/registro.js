const formRegistro = document.getElementById("formRegistro");
const mensaje = document.getElementById("mensaje");

formRegistro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    matricula: document.getElementById("matricula").value.trim(),
    carrera: document.getElementById("carrera").value.trim(),
    horario: document.getElementById("horario").value.trim(),
    horas_requeridas: Number(document.getElementById("horas_requeridas").value)
  };

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
      mensaje.textContent = resultado.mensaje;
      mensaje.className = "mensaje error";
      return;
    }

    mensaje.textContent = resultado.mensaje;
    mensaje.className = "mensaje success";

    formRegistro.reset();
    document.getElementById("horas_requeridas").value = 480;
    document.getElementById("carrera").value = "Ingeniería en Tecnologías de la Información";

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (error) {
    mensaje.textContent = "Error al conectar con el servidor.";
    mensaje.className = "mensaje error";
  }
});