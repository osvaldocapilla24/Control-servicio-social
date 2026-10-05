(() => {
  const idsInputsFecha = ["fechaManual", "editarFechaResponsable"];

  const camposFecha = idsInputsFecha
    .map((id) => document.getElementById(id))
    .filter((campo) => campo !== null);

  if (camposFecha.length === 0) return;

  let campoFecha = camposFecha[0];

  // Conserva el valor YYYY-MM-DD que utiliza app.js.
  campoFecha.readOnly = true;
  campoFecha.setAttribute("aria-haspopup", "dialog");
  campoFecha.setAttribute("aria-expanded", "false");

  const calendario = document.createElement("div");

  calendario.className = "calendario-apple";
  calendario.hidden = true;
  calendario.setAttribute("role", "dialog");
  calendario.setAttribute("aria-label", "Seleccionar fecha de registro");

  document.body.appendChild(calendario);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  let mesVisible;
  let fechaSeleccionada = "";
  let mostrarSelectores = false;

  function convertirFecha(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
  }

  function fechaPermitida(fecha) {
    return (
      (!campoFecha.min || fecha >= campoFecha.min) &&
      (!campoFecha.max || fecha <= campoFecha.max)
    );
  }

  function posicionarCalendario() {
    const campo = campoFecha.getBoundingClientRect();

    const izquierda = Math.max(
      12,
      Math.min(campo.left, window.innerWidth - calendario.offsetWidth - 12),
    );

    const arriba = Math.max(
      12,
      Math.min(
        campo.bottom + 6,
        window.innerHeight - calendario.offsetHeight - 12,
      ),
    );

    calendario.style.left = `${izquierda}px`;
    calendario.style.top = `${arriba}px`;
  }

  function cerrarCalendario(devolverFoco = true) {
    calendario.hidden = true;
    campoFecha.setAttribute("aria-expanded", "false");

    if (devolverFoco) {
      campoFecha.focus();
    }
  }

  function guardarFecha(fecha) {
    campoFecha.value = fecha;

    campoFecha.dispatchEvent(new Event("input", { bubbles: true }));

    campoFecha.dispatchEvent(new Event("change", { bubbles: true }));

    cerrarCalendario();
  }

  function dibujarCalendario() {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();

    calendario.innerHTML = `
            <div class="calendario-cabecera">
                <button
                    type="button"
                    class="calendario-titulo"
                    aria-label="Elegir mes y año"
                >
                    ${meses[mes]} de ${anio} <span>›</span>
                </button>

                <button
                    type="button"
                    class="calendario-flecha"
                    data-paso="-1"
                    aria-label="Mes anterior"
                >‹</button>

                <button
                    type="button"
                    class="calendario-flecha"
                    data-paso="1"
                    aria-label="Mes siguiente"
                >›</button>
            </div>
        `;

    if (mostrarSelectores) {
      const contenedor = document.createElement("div");
      contenedor.className = "calendario-selectores-personalizados";

      contenedor.innerHTML = `
      <div class="calendario-menu-meses">
        ${meses
          .map(
            (nombre, indice) => `
              <button
                type="button"
                class="calendario-opcion-mes ${indice === mes ? "seleccionada" : ""}"
                data-mes="${indice}"
              >
                <span class="marca"></span>
                <span>${nombre}</span>
              </button>
            `,
          )
          .join("")}
      </div>
  `;

      calendario.appendChild(contenedor);

      contenedor.querySelectorAll(".calendario-opcion-mes").forEach((boton) => {
        boton.addEventListener("click", () => {
          mesVisible = new Date(anio, Number(boton.dataset.mes), 1);
          mostrarSelectores = false;
          dibujarCalendario();
        });
      });
    }

    const semana = document.createElement("div");
    semana.className = "calendario-semana";

    ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"].forEach((nombre) => {
      const etiqueta = document.createElement("span");
      etiqueta.textContent = nombre;
      semana.appendChild(etiqueta);
    });

    calendario.appendChild(semana);

    const dias = document.createElement("div");
    dias.className = "calendario-dias";

    const primerDiaSemana = new Date(anio, mes, 1).getDay();
    const cantidadDias = new Date(anio, mes + 1, 0).getDate();

    for (let espacio = 0; espacio < primerDiaSemana; espacio++) {
      dias.appendChild(document.createElement("span"));
    }

    for (let dia = 1; dia <= cantidadDias; dia++) {
      const valor = convertirFecha(new Date(anio, mes, dia));
      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "calendario-dia";
      boton.textContent = dia;
      boton.disabled = !fechaPermitida(valor);

      boton.setAttribute("aria-pressed", String(fechaSeleccionada === valor));

      boton.setAttribute("aria-label", `${dia} de ${meses[mes]} de ${anio}`);

      boton.addEventListener("click", () => {
        fechaSeleccionada = valor;
        dibujarCalendario();

        calendario.querySelector('[aria-pressed="true"]').focus();
      });

      dias.appendChild(boton);
    }

    calendario.appendChild(dias);

    const pie = document.createElement("div");
    pie.className = "calendario-pie";

    pie.innerHTML = `
            <button type="button" class="calendario-restablecer">
                Restablecer
            </button>

            <button
              type="button"
              class="calendario-confirmar"
              aria-label="Confirmar fecha"
            >
              <svg class="icono-paloma" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 12.8l3.6 3.8L18.2 8.2"></path>
              </svg>
            </button>
        `;

    calendario.appendChild(pie);

    calendario
      .querySelector(".calendario-restablecer")
      .addEventListener("click", () => guardarFecha(""));

    calendario
      .querySelector(".calendario-confirmar")
      .addEventListener("click", () => {
        if (!fechaSeleccionada || fechaPermitida(fechaSeleccionada)) {
          guardarFecha(fechaSeleccionada);
        }
      });

    calendario
      .querySelector(".calendario-titulo")
      .addEventListener("click", () => {
        mostrarSelectores = !mostrarSelectores;
        dibujarCalendario();

        const focoSelector =
          calendario.querySelector(".calendario-opcion-mes.seleccionada") ||
          calendario.querySelector(".calendario-titulo");

        focoSelector.focus();
      });
    calendario.querySelectorAll("[data-paso]").forEach((boton) => {
      boton.addEventListener("click", () => {
        const paso = boton.dataset.paso;

        mesVisible = new Date(anio, mes + Number(paso), 1);
        dibujarCalendario();

        calendario.querySelector(`[data-paso="${paso}"]`).focus();
      });
    });

    posicionarCalendario();
  }

  function abrirCalendario() {
    if (campoFecha.disabled) return;

    fechaSeleccionada = campoFecha.value;

    const hoy = new Date();
    const fechaHoy = convertirFecha(hoy);

    if (!fechaSeleccionada) {
      fechaSeleccionada = fechaHoy;
    }

    const fechaInicial = new Date(`${fechaSeleccionada}T12:00:00`);
    mesVisible = new Date(
      fechaInicial.getFullYear(),
      fechaInicial.getMonth(),
      1,
    );

    mostrarSelectores = false;
    calendario.hidden = false;
    campoFecha.setAttribute("aria-expanded", "true");

    dibujarCalendario();

    const focoInicial =
      calendario.querySelector('[aria-pressed="true"]') ||
      calendario.querySelector(".calendario-titulo");

    focoInicial.focus();
  }

  camposFecha.forEach((campo) => {
    /*
    En iPhone, input type="date" abre el calendario nativo.
    Lo convertimos a text para usar solo nuestro calendario personalizado.
  */
    campo.type = "text";
    campo.readOnly = true;
    campo.inputMode = "none";
    campo.autocomplete = "off";

    campo.setAttribute("aria-haspopup", "dialog");
    campo.setAttribute("aria-expanded", "false");

    campo.addEventListener("click", (evento) => {
      evento.preventDefault();
      campoFecha = campo;
      abrirCalendario();
    });

    campo.addEventListener("keydown", (evento) => {
      if (["Enter", " ", "ArrowDown"].includes(evento.key)) {
        evento.preventDefault();
        campoFecha = campo;
        abrirCalendario();
      }
    });
  });

  document.addEventListener("pointerdown", (evento) => {
    if (
      !calendario.hidden &&
      evento.target !== campoFecha &&
      !calendario.contains(evento.target)
    ) {
      cerrarCalendario(false);
    }
  });

  calendario.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      evento.preventDefault();
      cerrarCalendario();
    }

    if (evento.key === "Tab") {
      const controles = [
        ...calendario.querySelectorAll("button:not(:disabled)"),
      ];

      const primero = controles[0];
      const ultimo = controles[controles.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }
  });

  window.addEventListener("resize", () => {
    if (!calendario.hidden) posicionarCalendario();
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!calendario.hidden) posicionarCalendario();
    },
    true,
  );

  // Respeta el bloqueo del campo que realiza app.js.
  new MutationObserver(() => {
    if (campoFecha.disabled) cerrarCalendario(false);
  }).observe(campoFecha, {
    attributes: true,
    attributeFilter: ["disabled"],
  });
})();
