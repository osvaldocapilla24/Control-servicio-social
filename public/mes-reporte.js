(() => {
  const inputMes = document.getElementById("mesReporteGeneral");

  if (!inputMes) return;

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

  inputMes.type = "text";
  inputMes.readOnly = true;
  inputMes.inputMode = "none";
  inputMes.autocomplete = "off";

  const selector = document.createElement("div");
  selector.className = "selector-mes-apple";
  selector.hidden = true;

  selector.innerHTML = `
    <div class="selector-mes-columnas">
      <div class="selector-mes-columna" id="columnaMesesReporte"></div>
      <div class="selector-mes-columna" id="columnaAniosReporte"></div>
    </div>

    <div class="selector-mes-pie">
      <button type="button" class="selector-mes-restablecer">Restablecer</button>

      <button type="button" class="selector-mes-confirmar" aria-label="Confirmar mes">
        <svg class="icono-paloma" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 12.8l3.6 3.8L18.2 8.2"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(selector);

  const columnaMeses = selector.querySelector("#columnaMesesReporte");
  const columnaAnios = selector.querySelector("#columnaAniosReporte");
  const btnRestablecer = selector.querySelector(".selector-mes-restablecer");
  const btnConfirmar = selector.querySelector(".selector-mes-confirmar");

  let mesSeleccionado = new Date().getMonth();
  let anioSeleccionado = new Date().getFullYear();

  function construirOpciones() {
    columnaMeses.innerHTML = "";
    columnaAnios.innerHTML = "";

    meses.forEach((mes, index) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "selector-mes-opcion";
      boton.textContent = mes;
      boton.dataset.tipo = "mes";
      boton.dataset.valor = index;

      boton.addEventListener("pointerdown", (evento) => {
        evento.preventDefault();
      });

      boton.addEventListener("click", () => {
        centrarBoton(boton);
      });
      columnaMeses.appendChild(boton);
    });

    const anioActual = new Date().getFullYear();

    for (let anio = anioActual - 5; anio <= anioActual + 5; anio++) {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "selector-mes-opcion";
      boton.textContent = anio;
      boton.dataset.tipo = "anio";
      boton.dataset.valor = anio;

      boton.addEventListener("pointerdown", (evento) => {
        evento.preventDefault();
      });

      boton.addEventListener("click", () => {
        centrarBoton(boton);
      });
      columnaAnios.appendChild(boton);
    }
  }

  function obtenerBotonCentral(columna) {
    const botones = Array.from(
      columna.querySelectorAll(".selector-mes-opcion"),
    );
    const centroColumna = columna.scrollTop + columna.clientHeight / 2;

    let botonMasCercano = null;
    let distanciaMenor = Infinity;

    botones.forEach((boton) => {
      const centroBoton = boton.offsetTop + boton.offsetHeight / 2;
      const distancia = Math.abs(centroBoton - centroColumna);

      if (distancia < distanciaMenor) {
        distanciaMenor = distancia;
        botonMasCercano = boton;
      }
    });

    return botonMasCercano;
  }

  function actualizarSeleccionColumna(columna) {
    const botonCentral = obtenerBotonCentral(columna);

    if (!botonCentral) return;

    columna.querySelectorAll(".selector-mes-opcion").forEach((boton) => {
      boton.classList.remove("seleccionada");
    });

    botonCentral.classList.add("seleccionada");

    if (botonCentral.dataset.tipo === "mes") {
      mesSeleccionado = Number(botonCentral.dataset.valor);
    }

    if (botonCentral.dataset.tipo === "anio") {
      anioSeleccionado = Number(botonCentral.dataset.valor);
    }
  }

  function actualizarSeleccion() {
    actualizarSeleccionColumna(columnaMeses);
    actualizarSeleccionColumna(columnaAnios);
  }

  function centrarBoton(boton) {
    const columna = boton.parentElement;

    const posicion =
      boton.offsetTop - columna.clientHeight / 2 + boton.offsetHeight / 2;

    columna.scrollTo({
      top: posicion,
      behavior: "smooth",
    });

    setTimeout(actualizarSeleccion, 250);
  }

  function centrarValor(columna, tipo, valor) {
    const boton = columna.querySelector(
      `.selector-mes-opcion[data-tipo="${tipo}"][data-valor="${valor}"]`,
    );

    if (!boton) return;

    const posicion =
      boton.offsetTop - columna.clientHeight / 2 + boton.offsetHeight / 2;

    columna.scrollTop = posicion;
  }

  function obtenerValoresDesdeInput() {
    if (!inputMes.value) {
      const hoy = new Date();

      return {
        mes: hoy.getMonth(),
        anio: hoy.getFullYear(),
      };
    }

    const partes = inputMes.value.split("-");

    return {
      anio: Number(partes[0]),
      mes: Number(partes[1]) - 1,
    };
  }

  function mostrarTextoInput() {
    inputMes.value = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, "0")}`;
    inputMes.dataset.texto = `${meses[mesSeleccionado]} ${anioSeleccionado}`;
  }

  function posicionarSelector() {
    const rect = inputMes.getBoundingClientRect();
    const margen = 8;

    let top = rect.bottom + margen;
    let left = rect.left;

    if (left + 420 > window.innerWidth - 12) {
      left = window.innerWidth - 432;
    }

    if (top + 320 > window.innerHeight - 12) {
      top = rect.top - 320;
    }

    selector.style.top = `${Math.max(12, top)}px`;
    selector.style.left = `${Math.max(12, left)}px`;
  }

  function abrirSelector() {
    const valores = obtenerValoresDesdeInput();

    mesSeleccionado = valores.mes;
    anioSeleccionado = valores.anio;

    selector.hidden = false;
    posicionarSelector();

    setTimeout(() => {
      centrarValor(columnaMeses, "mes", mesSeleccionado);
      centrarValor(columnaAnios, "anio", anioSeleccionado);
      actualizarSeleccion();
    }, 0);
  }

  function cerrarSelector() {
    selector.hidden = true;
  }

  let temporizadorScroll;

  function manejarScroll() {
    clearTimeout(temporizadorScroll);

    temporizadorScroll = setTimeout(() => {
      actualizarSeleccion();
    }, 80);
  }

  columnaMeses.addEventListener("scroll", manejarScroll);
  columnaAnios.addEventListener("scroll", manejarScroll);

  btnConfirmar.addEventListener("click", () => {
    actualizarSeleccion();

    inputMes.value = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, "0")}`;
    inputMes.dispatchEvent(new Event("input", { bubbles: true }));
    inputMes.dispatchEvent(new Event("change", { bubbles: true }));

    cerrarSelector();
  });

  btnRestablecer.addEventListener("click", () => {
    inputMes.value = "";
    inputMes.dispatchEvent(new Event("input", { bubbles: true }));
    inputMes.dispatchEvent(new Event("change", { bubbles: true }));

    cerrarSelector();
  });

  inputMes.addEventListener("click", (event) => {
    event.preventDefault();
    abrirSelector();
  });

  document.addEventListener("click", (event) => {
    if (
      !selector.hidden &&
      event.target !== inputMes &&
      !selector.contains(event.target)
    ) {
      cerrarSelector();
    }
  });

  window.addEventListener("resize", () => {
    if (!selector.hidden) {
      posicionarSelector();
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!selector.hidden) {
        posicionarSelector();
      }
    },
    true,
  );

  construirOpciones();
})();
