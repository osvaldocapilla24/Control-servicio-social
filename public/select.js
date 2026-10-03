(function () {
  const idsSelects = [
    "carrera",
    "periodoServicio",
    "selectorPeriodoResponsable",
  ];

  let selectActivo = null;
  let botonActivo = null;

  const modal = document.createElement("div");
  modal.className = "select-modal";
  modal.hidden = true;
  document.body.appendChild(modal);

  function obtenerTextoSeleccionado(select) {
    const opcion = select.options[select.selectedIndex];

    if (!opcion) {
      return "Selecciona una opción";
    }

    return opcion.textContent;
  }

  function crearBotonVisual(select) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "select-personalizado";
    boton.textContent = obtenerTextoSeleccionado(select);

    select.classList.add("select-original-oculto");
    select.insertAdjacentElement("afterend", boton);

    boton.addEventListener("click", (event) => {
      event.preventDefault();
      abrirModal(select, boton);
    });

    select.addEventListener("change", () => {
      boton.textContent = obtenerTextoSeleccionado(select);
    });

    return boton;
  }

  function abrirModal(select, boton) {
    selectActivo = select;
    botonActivo = boton;

    modal.innerHTML = "";

    Array.from(select.options).forEach((opcion) => {
      const botonOpcion = document.createElement("button");
      botonOpcion.type = "button";
      botonOpcion.className = "select-opcion";

      if (opcion.value === select.value) {
        botonOpcion.classList.add("seleccionada");
      }

      botonOpcion.innerHTML = `
        <span class="marca"></span>
        <span class="texto">${opcion.textContent}</span>
      `;

      botonOpcion.addEventListener("click", () => {
        select.value = opcion.value;
        select.dispatchEvent(new Event("change"));

        boton.textContent = opcion.textContent;

        cerrarModal();
      });

      modal.appendChild(botonOpcion);
    });

    modal.hidden = false;
    boton.classList.add("activo");

    posicionarModal(boton);
  }

  function posicionarModal(boton) {
    const rect = boton.getBoundingClientRect();

    const margen = 8;
    const margenPantalla = 16;

    const anchoModal = modal.offsetWidth || 360;
    const altoModal = modal.offsetHeight || modal.scrollHeight || 220;

    let left = rect.left;
    let top = rect.bottom + margen;

    if (left + anchoModal > window.innerWidth - margenPantalla) {
      left = window.innerWidth - anchoModal - margenPantalla;
    }

    if (left < margenPantalla) {
      left = margenPantalla;
    }

    const espacioAbajo = window.innerHeight - rect.bottom;
    const espacioArriba = rect.top;

    if (
      espacioAbajo < altoModal + margen &&
      espacioArriba > altoModal + margen
    ) {
      top = rect.top - altoModal - margen;
    }

    if (top + altoModal > window.innerHeight - margenPantalla) {
      top = window.innerHeight - altoModal - margenPantalla;
    }

    if (top < margenPantalla) {
      top = margenPantalla;
    }

    modal.style.left = `${left}px`;
    modal.style.top = `${top}px`;
  }

  function cerrarModal() {
    modal.hidden = true;

    if (botonActivo) {
      botonActivo.classList.remove("activo");
    }

    selectActivo = null;
    botonActivo = null;
  }

  document.addEventListener("click", (event) => {
    const clicDentroModal = modal.contains(event.target);
    const clicEnBoton = event.target.classList.contains("select-personalizado");

    if (!clicDentroModal && !clicEnBoton) {
      cerrarModal();
    }
  });

  window.addEventListener("resize", () => {
    if (!modal.hidden && botonActivo) {
      posicionarModal(botonActivo);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!modal.hidden && botonActivo) {
        posicionarModal(botonActivo);
      }
    },
    true,
  );

  idsSelects.forEach((id) => {
    const select = document.getElementById(id);

    if (!select) {
      return;
    }

    crearBotonVisual(select);
  });
})();
