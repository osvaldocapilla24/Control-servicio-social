// =====================================
// NAVEGACIÓN DEL DASHBOARD RESPONSABLE
// =====================================

const contenidoResponsable = document.querySelector(".dashboard-contenido");

const vistaInicio = document.getElementById("vistaInicioResponsable");

// Crear contenedores de las vistas
const vistaPrestadores = document.createElement("section");
vistaPrestadores.id = "vistaPrestadoresResponsable";
vistaPrestadores.className = "vista-responsable hidden";

const vistaPeriodos = document.createElement("section");
vistaPeriodos.id = "vistaPeriodosResponsable";
vistaPeriodos.className = "vista-responsable hidden";

const vistaReportes = document.createElement("section");
vistaReportes.id = "vistaReportesResponsable";
vistaReportes.className = "vista-responsable hidden";

const vistaArchivados = document.createElement("section");
vistaArchivados.id = "vistaArchivadosResponsable";
vistaArchivados.className = "vista-responsable hidden";

// Recuperar los elementos existentes
const tarjetaPeriodo = contenidoResponsable.querySelector(".periodo-card");
const tablaPrincipal = contenidoResponsable.querySelector(":scope > table");

// Mover las secciones sin recrear sus elementos
// ni perder sus eventos
vistaPrestadores.appendChild(detallePrestador);
vistaPrestadores.appendChild(tablaPrincipal);

vistaPeriodos.appendChild(tarjetaPeriodo);

vistaReportes.appendChild(seccionReportesResponsable);
vistaArchivados.appendChild(seccionArchivadosResponsable);

contenidoResponsable.append(
  vistaPrestadores,
  vistaPeriodos,
  vistaReportes,
  vistaArchivados
);

// Vistas disponibles
const vistasResponsable = {
  inicio: vistaInicio,
  prestadores: vistaPrestadores,
  periodos: vistaPeriodos,
  reportes: vistaReportes,
  archivados: vistaArchivados
};

// Cambiar la pantalla visible
function cambiarVistaResponsable(nombreVista) {
  if (!vistasResponsable[nombreVista]) {
    return;
  }

  Object.values(vistasResponsable).forEach((vista) => {
    vista.classList.add("hidden");
  });

  vistasResponsable[nombreVista].classList.remove("hidden");

  // Actualizar opción activa del menú lateral
  document.querySelectorAll(
    ".sidebar-navegacion [data-vista]"
  ).forEach((enlace) => {
    enlace.classList.toggle(
      "activo",
      enlace.dataset.vista === nombreVista
    );
  });

  cerrarMenuResponsable();
}

// Control único de navegación
async function navegarResponsable(nombreVista) {
  if (nombreVista === "reportes") {
    await mostrarSeccionReportes();
  } else if (nombreVista === "archivados") {
    await mostrarSeccionArchivados();
  } else {
    cambiarVistaResponsable(nombreVista);
  }
}

// Navegación lateral
document.querySelectorAll(
  ".sidebar-navegacion [data-vista]"
).forEach((enlace) => {
  enlace.addEventListener("click", (evento) => {
    evento.preventDefault();
    navegarResponsable(enlace.dataset.vista);
  });
});

// Accesos rápidos del Inicio
document.querySelectorAll(
  ".inicio-accesos [data-vista]"
).forEach((boton) => {
  boton.addEventListener("click", () => {
    navegarResponsable(boton.dataset.vista);
  });
});

// TABLAS: desplazamiento horizontal limitado a su contenedor
function prepararTablasResponsable() {
  [vistaPrestadores, vistaArchivados, detallePrestador].forEach((seccion) => {
    seccion.querySelectorAll("table").forEach((tabla) => {
      if (tabla.parentElement.classList.contains("tabla-scroll-responsable")) return;
      const envoltura = document.createElement("div");
      envoltura.className = "tabla-scroll-responsable";
      envoltura.tabIndex = 0;
      envoltura.setAttribute("role", "region");
      envoltura.setAttribute("aria-label", "Tabla desplazable horizontalmente");
      tabla.parentNode.insertBefore(envoltura, tabla);
      envoltura.appendChild(tabla);
    });
  });
}
prepararTablasResponsable();

// MENÚ MÓVIL
const btnAbrirSidebarMovil = document.getElementById("btnAbrirSidebarMovil");
const sidebarResponsable = document.getElementById("sidebarResponsable");
const fondoSidebarMovil = document.getElementById("fondoSidebarMovil");

function cerrarSidebarMovil() {
  if (sidebarResponsable) {
    sidebarResponsable.classList.remove("abierto");
  }

  if (fondoSidebarMovil) {
    fondoSidebarMovil.classList.add("hidden");
  }

  if (btnAbrirSidebarMovil) {
    btnAbrirSidebarMovil.setAttribute("aria-expanded", "false");
    btnAbrirSidebarMovil.setAttribute("aria-label", "Abrir menú");
  }

  document.body.classList.remove("sidebar-movil-abierto");
}

if (btnAbrirSidebarMovil && sidebarResponsable && fondoSidebarMovil) {
  btnAbrirSidebarMovil.addEventListener("click", () => {
    const abrir = !sidebarResponsable.classList.contains("abierto");

    if (!abrir) {
      cerrarSidebarMovil();
      return;
    }

    sidebarResponsable.classList.add("abierto");
    fondoSidebarMovil.classList.remove("hidden");
    btnAbrirSidebarMovil.setAttribute("aria-expanded", "true");
    btnAbrirSidebarMovil.setAttribute("aria-label", "Cerrar menú");
    document.body.classList.add("sidebar-movil-abierto");
  });
}

if (fondoSidebarMovil) {
  fondoSidebarMovil.addEventListener("click", cerrarSidebarMovil);
}
document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") cerrarSidebarMovil();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) cerrarSidebarMovil();
});

// Pantalla inicial del dashboard
cambiarVistaResponsable("inicio");

// Generar los iconos después de preparar la navegación
if (window.lucide) {
  lucide.createIcons();
}