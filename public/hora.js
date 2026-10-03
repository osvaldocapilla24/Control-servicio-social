(function () {
    const idsInputsHora = [
        "entradaManual",
        "salidaManual",
        "editarEntrada",
        "editarSalida",
        "horaEntradaServicio",
        "horaSalidaServicio",
        "editarEntradaResponsable",
        "editarSalidaResponsable"
    ];

  const REPETICIONES_HORAS = 5;
  const REPETICIONES_MINUTOS = 3;

  let inputActivo = null;
  let horaSeleccionada = 12;
  let minutoSeleccionado = 0;
  let periodoSeleccionado = "PM";

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
        periodoSeleccionado = valor;
        pintarPeriodo();
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
      for (let h = 1; h <= 12; h++) {
        columnaHoras.appendChild(crearBoton(String(h), h, "hora", vuelta));
      }
    }

    for (let vuelta = 0; vuelta < REPETICIONES_MINUTOS; vuelta++) {
      for (let m = 0; m <= 59; m++) {
        columnaMinutos.appendChild(
          crearBoton(String(m).padStart(2, "0"), m, "minuto", vuelta)
        );
      }
    }

    columnaPeriodo.appendChild(crearBoton("a.m.", "AM", "periodo"));
    columnaPeriodo.appendChild(crearBoton("p.m.", "PM", "periodo"));
  }

  function obtenerBotonCentral(columna) {
    const botones = Array.from(columna.querySelectorAll(".selector-hora-opcion"));
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
    const valor = botonCentral.dataset.valor;

    if (tipo === "hora") {
      horaSeleccionada = Number(valor);
    }

    if (tipo === "minuto") {
      minutoSeleccionado = Number(valor);
    }
  }

  function pintarPeriodo() {
    columnaPeriodo.querySelectorAll(".selector-hora-opcion").forEach((boton) => {
      boton.classList.toggle(
        "seleccionada",
        boton.dataset.valor === periodoSeleccionado
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
      boton.offsetTop -
      columna.clientHeight / 2 +
      boton.offsetHeight / 2;

    columna.scrollTo({
      top: posicion,
      behavior: "smooth"
    });

    setTimeout(actualizarSeleccion, 250);
  }

  function centrarValor(columna, tipo, valor) {
    const botones = Array.from(
      columna.querySelectorAll(`.selector-hora-opcion[data-tipo="${tipo}"]`)
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
      boton.offsetTop -
      columna.clientHeight / 2 +
      boton.offsetHeight / 2;

    columna.scrollTop = posicion;
  }

  function convertirInputASelector(valor) {
    if (!valor) {
      const ahora = new Date();
      let horas = ahora.getHours();
      const minutos = ahora.getMinutes();

      const periodo = horas >= 12 ? "PM" : "AM";
      horas = horas % 12;

      if (horas === 0) {
        horas = 12;
      }

      return {
        hora: horas,
        minuto: minutos,
        periodo
      };
    }

    const partes = valor.split(":");
    let horas24 = Number(partes[0]);
    const minutos = Number(partes[1]);

    const periodo = horas24 >= 12 ? "PM" : "AM";
    let horas12 = horas24 % 12;

    if (horas12 === 0) {
      horas12 = 12;
    }

    return {
      hora: horas12,
      minuto: minutos,
      periodo
    };
  }

  function convertirSelectorAInput() {
    let horas24 = horaSeleccionada;

    if (periodoSeleccionado === "PM" && horas24 !== 12) {
      horas24 += 12;
    }

    if (periodoSeleccionado === "AM" && horas24 === 12) {
      horas24 = 0;
    }

    return `${String(horas24).padStart(2, "0")}:${String(minutoSeleccionado).padStart(2, "0")}`;
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
    periodoSeleccionado = valores.periodo;

    selector.hidden = false;
    posicionarSelector(input);

    setTimeout(() => {
      centrarValor(columnaHoras, "hora", horaSeleccionada);
      centrarValor(columnaMinutos, "minuto", minutoSeleccionado);
      pintarPeriodo();
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
    inputActivo.dispatchEvent(new Event("change"));
    cerrarSelector();
  });

  btnRestablecer.addEventListener("click", () => {
    if (!inputActivo) {
      return;
    }

    inputActivo.value = "";
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

  window.addEventListener("scroll", () => {
    if (!selector.hidden && inputActivo) {
      posicionarSelector(inputActivo);
    }
  }, true);

  construirOpciones();

  idsInputsHora.forEach((id) => {
    const input = document.getElementById(id);

    if (!input) {
      return;
    }

    input.classList.add("selector-hora-activo");

    input.addEventListener("click", (event) => {
      event.preventDefault();
      abrirSelector(input);
    });

    input.addEventListener("focus", () => {
      abrirSelector(input);
    });

    input.addEventListener("keydown", (event) => {
      event.preventDefault();
    });
  });
})();