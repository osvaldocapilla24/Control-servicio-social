(function () {
  const idsInputsHora = [
    "entradaManual",
    "salidaManual",
    "editarEntrada",
    "editarSalida",
    "horaEntradaServicio",
    "horaSalidaServicio",
    "editarEntradaResponsable",
    "editarSalidaResponsable",
    "editarHoraEntradaServicio",
    "editarHoraSalidaServicio",
  ];

  const REPETICIONES_HORAS = 3;
  const REPETICIONES_MINUTOS = 3;

  let inputActivo = null;
  let horaSeleccionada = 0;
  let minutoSeleccionado = 0;

  const selector = document.createElement("div");
  selector.className = "selector-hora";
  selector.hidden = true;

  selector.innerHTML = `
    <div class="selector-hora-columnas">
      <div class="selector-hora-columna" id="selectorHoras"></div>
      <div class="selector-hora-columna" id="selectorMinutos"></div>
      <div class="selector-hora-columna" id="selectorPeriodo"></div>
    </div>

    <div class="selector-hora-pie">
      <button type="button" class="selector-hora-restablecer">Restablecer</button>
      <button type="button" class="selector-hora-confirmar">✓</button>
    </div>
  `;

  document.body.appendChild(selector);

  const columnaHoras = selector.querySelector("#selectorHoras");
  const columnaMinutos = selector.querySelector("#selectorMinutos");
  const columnaPeriodo = selector.querySelector("#selectorPeriodo");
  const btnRestablecer = selector.querySelector(".selector-hora-restablecer");
  const btnConfirmar = selector.querySelector(".selector-hora-confirmar");

  function obtenerPeriodoDesdeHora(hora) {
    return hora < 12 ? "AM" : "PM";
  }

  function crearBoton(texto, valor, tipo, vuelta = 0) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "selector-hora-opcion";
    boton.textContent = texto;
    boton.dataset.valor = valor;
    boton.dataset.tipo = tipo;
    boton.dataset.vuelta = vuelta;

    boton.addEventListener("click", () => {
      if (tipo === "periodo") {
        cambiarPeriodo(valor);
        return;
      }

      centrarBoton(boton);
    });

    return boton;
  }

  function construirOpciones() {
    columnaHoras.innerHTML = "";
    columnaMinutos.innerHTML = "";
    columnaPeriodo.innerHTML = "";

    for (let vuelta = 0; vuelta < REPETICIONES_HORAS; vuelta++) {
      for (let h = 0; h <= 23; h++) {
        columnaHoras.appendChild(
          crearBoton(String(h).padStart(2, "0"), h, "hora", vuelta),
        );
      }
    }

    for (let vuelta = 0; vuelta < REPETICIONES_MINUTOS; vuelta++) {
      for (let m = 0; m <= 59; m++) {
        columnaMinutos.appendChild(
          crearBoton(String(m).padStart(2, "0"), m, "minuto", vuelta),
        );
      }
    }

    columnaPeriodo.appendChild(crearBoton("a.m.", "AM", "periodo"));
    columnaPeriodo.appendChild(crearBoton("p.m.", "PM", "periodo"));
  }

  function cambiarPeriodo(periodo) {
    const periodoActual = obtenerPeriodoDesdeHora(horaSeleccionada);

    if (periodo === periodoActual) {
      pintarPeriodo();
      return;
    }

    if (periodo === "PM" && horaSeleccionada < 12) {
      horaSeleccionada += 12;
    }

    if (periodo === "AM" && horaSeleccionada >= 12) {
      horaSeleccionada -= 12;
    }

    centrarValor(columnaHoras, "hora", horaSeleccionada);
    pintarPeriodo();
    actualizarSeleccion();
  }

  function obtenerBotonCentral(columna) {
    const botones = Array.from(
      columna.querySelectorAll(".selector-hora-opcion"),
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

    if (!botonCentral) {
      return;
    }

    columna.querySelectorAll(".selector-hora-opcion").forEach((boton) => {
      boton.classList.remove("seleccionada");
    });

    botonCentral.classList.add("seleccionada");

    const tipo = botonCentral.dataset.tipo;
    const valor = Number(botonCentral.dataset.valor);

    if (tipo === "hora") {
      horaSeleccionada = valor;
    }

    if (tipo === "minuto") {
      minutoSeleccionado = valor;
    }
  }

  function pintarPeriodo() {
    const periodoActual = obtenerPeriodoDesdeHora(horaSeleccionada);

    columnaPeriodo
      .querySelectorAll(".selector-hora-opcion")
      .forEach((boton) => {
        boton.classList.toggle(
          "seleccionada",
          boton.dataset.valor === periodoActual,
        );
      });
  }

  function actualizarSeleccion() {
    actualizarSeleccionColumna(columnaHoras);
    actualizarSeleccionColumna(columnaMinutos);
    pintarPeriodo();
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
    const botones = Array.from(
      columna.querySelectorAll(`.selector-hora-opcion[data-tipo="${tipo}"]`),
    );

    const vueltaCentral =
      tipo === "hora"
        ? Math.floor(REPETICIONES_HORAS / 2)
        : Math.floor(REPETICIONES_MINUTOS / 2);

    const boton = botones.find((item) => {
      return (
        Number(item.dataset.valor) === Number(valor) &&
        Number(item.dataset.vuelta) === vueltaCentral
      );
    });

    if (!boton) {
      return;
    }

    const posicion =
      boton.offsetTop - columna.clientHeight / 2 + boton.offsetHeight / 2;

    columna.scrollTop = posicion;
  }

  function convertirInputASelector(valor) {
    if (!valor) {
      const ahora = new Date();

      return {
        hora: ahora.getHours(),
        minuto: ahora.getMinutes(),
      };
    }

    const partes = valor.split(":");

    return {
      hora: Number(partes[0]) || 0,
      minuto: Number(partes[1]) || 0,
    };
  }

  function convertirSelectorAInput() {
    return `${String(horaSeleccionada).padStart(2, "0")}:${String(
      minutoSeleccionado,
    ).padStart(2, "0")}`;
  }

  function posicionarSelector(input) {
    const rect = input.getBoundingClientRect();
    const margen = 8;

    let top = rect.bottom + margen;
    let left = rect.left;

    if (left + 310 > window.innerWidth - 12) {
      left = window.innerWidth - 322;
    }

    if (top + 300 > window.innerHeight - 12) {
      top = rect.top - 300;
    }

    selector.style.top = `${Math.max(12, top)}px`;
    selector.style.left = `${Math.max(12, left)}px`;
  }

  function abrirSelector(input) {
    inputActivo = input;

    const valores = convertirInputASelector(input.value);

    horaSeleccionada = valores.hora;
    minutoSeleccionado = valores.minuto;

    selector.hidden = false;
    posicionarSelector(input);

    setTimeout(() => {
      centrarValor(columnaHoras, "hora", horaSeleccionada);
      centrarValor(columnaMinutos, "minuto", minutoSeleccionado);
      actualizarSeleccion();
    }, 0);
  }

  function cerrarSelector() {
    selector.hidden = true;
    inputActivo = null;
  }

  let temporizadorScroll;

  function manejarScroll() {
    clearTimeout(temporizadorScroll);

    temporizadorScroll = setTimeout(() => {
      actualizarSeleccion();
    }, 80);
  }

  columnaHoras.addEventListener("scroll", manejarScroll);
  columnaMinutos.addEventListener("scroll", manejarScroll);

  btnConfirmar.addEventListener("click", () => {
    if (!inputActivo) {
      return;
    }

    actualizarSeleccion();

    inputActivo.value = convertirSelectorAInput();
    inputActivo.dispatchEvent(new Event("input"));
    inputActivo.dispatchEvent(new Event("change"));

    cerrarSelector();
  });

  btnRestablecer.addEventListener("click", () => {
    if (!inputActivo) {
      return;
    }

    inputActivo.value = "";
    inputActivo.dispatchEvent(new Event("input"));
    inputActivo.dispatchEvent(new Event("change"));

    cerrarSelector();
  });

  document.addEventListener("click", (event) => {
    const dioClickDentroSelector = selector.contains(event.target);

    const dioClickEnInputHora = idsInputsHora.some((id) => {
      const input = document.getElementById(id);
      return input === event.target;
    });

    if (!dioClickDentroSelector && !dioClickEnInputHora) {
      cerrarSelector();
    }
  });

  window.addEventListener("resize", () => {
    if (!selector.hidden && inputActivo) {
      posicionarSelector(inputActivo);
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      if (!selector.hidden && inputActivo) {
        posicionarSelector(inputActivo);
      }
    },
    true,
  );

  construirOpciones();

  idsInputsHora.forEach((id) => {
    const input = document.getElementById(id);

    if (!input) {
      return;
    }

    /*
    En iPhone, input type="time" abre el selector nativo.
    Lo convertimos a text para usar solo nuestro selector personalizado.
  */
    input.type = "text";
    input.autocomplete = "off";
    input.placeholder = "--:--";
    input.classList.add("selector-hora-activo");

    const esCelular = window.matchMedia("(max-width: 768px)").matches;

    if (esCelular) {
      input.readOnly = true;
      input.inputMode = "none";
    } else {
      input.readOnly = false;
      input.inputMode = "numeric";
    }

    input.addEventListener("click", (event) => {
      event.preventDefault();
      abrirSelector(input);
    });

    input.addEventListener("focus", () => {
      inputActivo = input;
    });

    input.addEventListener("input", () => {
      const esCelular = window.matchMedia("(max-width: 768px)").matches;

      if (esCelular) {
        return;
      }

      let valor = input.value.replace(/[^0-9:]/g, "");

      if (valor.length === 2 && !valor.includes(":")) {
        valor = `${valor}:`;
      }

      if (valor.length > 5) {
        valor = valor.slice(0, 5);
      }

      input.value = valor;

      const valores = convertirInputASelector(input.value);

      horaSeleccionada = valores.hora;
      minutoSeleccionado = valores.minuto;
    });

    input.addEventListener("blur", () => {
      const esCelular = window.matchMedia("(max-width: 768px)").matches;

      if (esCelular) {
        return;
      }

      if (!input.value) {
        return;
      }

      const partes = input.value.split(":");

      if (partes.length !== 2) {
        input.value = "";
        return;
      }

      let hora = Number(partes[0]);
      let minuto = Number(partes[1]);

      if (
        !Number.isInteger(hora) ||
        !Number.isInteger(minuto) ||
        hora < 0 ||
        hora > 23 ||
        minuto < 0 ||
        minuto > 59
      ) {
        input.value = "";
        return;
      }

      input.value = `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
    });
  });
})();
