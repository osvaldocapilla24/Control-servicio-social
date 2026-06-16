require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.connect()
  .then((client) => {
    console.log("Base de datos Supabase conectada correctamente.");
    client.release();
  })
  .catch((error) => {
    console.error("Error al conectar con Supabase:", error.message);
  });

function obtenerFechaActual() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City"
  });
}

function obtenerHoraActual() {
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function fechaEsFutura(fecha) {
  const hoy = obtenerFechaActual();
  return fecha > hoy;
}

function calcularHoras(horaEntrada, horaSalida) {
  const entradaTexto = horaEntrada.substring(0, 5);
  const salidaTexto = horaSalida.substring(0, 5);

  const [h1, m1] = entradaTexto.split(":").map(Number);
  const [h2, m2] = salidaTexto.split(":").map(Number);

  const entrada = h1 * 60 + m1;
  const salida = h2 * 60 + m2;

  const diferenciaMinutos = salida - entrada;

  if (diferenciaMinutos <= 0) {
    return 0;
  }

  return diferenciaMinutos / 60;
}

/* REGISTRAR PRESTADOR */

app.post("/api/prestadores", async (req, res) => {
  try {
    let { nombre, matricula, carrera, horario, horas_requeridas } = req.body;

    nombre = nombre ? nombre.trim() : "";
    matricula = matricula ? matricula.trim() : "";
    carrera = carrera ? carrera.trim() : "";
    horario = horario ? horario.trim() : "";
    horas_requeridas = Number(horas_requeridas);

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio." });
    }

    if (!matricula) {
      return res.status(400).json({ mensaje: "La matrícula es obligatoria." });
    }

    if (!carrera) {
      return res.status(400).json({ mensaje: "La carrera es obligatoria." });
    }

    if (!horario) {
      return res.status(400).json({ mensaje: "El horario es obligatorio." });
    }

    if (!horas_requeridas || horas_requeridas <= 0) {
      return res.status(400).json({
        mensaje: "Las horas requeridas deben ser mayor a 0."
      });
    }

    const fechaRegistro = obtenerFechaActual();

    const resultado = await pool.query(
      `
      INSERT INTO prestadores
      (nombre, matricula, carrera, horario, horas_requeridas, fecha_registro, estatus)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        nombre,
        matricula,
        carrera,
        horario,
        horas_requeridas,
        fechaRegistro,
        "activo"
      ]
    );

    res.json({
      mensaje: "Prestador registrado correctamente.",
      id: resultado.rows[0].id
    });

  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        mensaje: "Ya existe un prestador registrado con esa matrícula."
      });
    }

    console.error(error);
    res.status(500).json({
      mensaje: "Error al registrar prestador."
    });
  }
});

/* LISTAR PRESTADORES */

app.get("/api/prestadores", async (req, res) => {
  try {
    const resultado = await pool.query(
      `
      SELECT id, nombre, matricula, carrera, horario, horas_requeridas, estatus
      FROM prestadores
      ORDER BY nombre ASC
      `
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener prestadores."
    });
  }
});

/* BUSCAR PRESTADOR */

app.get("/api/prestadores/buscar/:texto", async (req, res) => {
  try {
    const texto = req.params.texto.trim();

    if (!texto) {
      return res.status(400).json({
        mensaje: "Debes escribir un nombre o matrícula."
      });
    }

    const resultado = await pool.query(
      `
      SELECT id, nombre, matricula, carrera, horario, horas_requeridas, estatus
      FROM prestadores
      WHERE matricula = $1
      OR nombre ILIKE $2
      LIMIT 1
      `,
      [texto, `%${texto}%`]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No se encontró ningún prestador con ese nombre o matrícula."
      });
    }

    res.json({
      mensaje: "Prestador encontrado.",
      prestador: resultado.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al buscar prestador."
    });
  }
});

/* MARCAR ENTRADA */

app.post("/api/entrada", async (req, res) => {
  try {
    const { prestador_id, actividad } = req.body;

    if (!prestador_id) {
      return res.status(400).json({
        mensaje: "Debes seleccionar un prestador."
      });
    }

    const fecha = obtenerFechaActual();
    const horaEntrada = obtenerHoraActual();

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre, estatus
      FROM prestadores
      WHERE id = $1
      `,
      [prestador_id]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const prestador = prestadorResultado.rows[0];

    if (prestador.estatus === "finalizado") {
      return res.status(403).json({
        mensaje: "No puedes registrar entrada porque este prestador ya finalizó su servicio."
      });
    }

    const abiertoResultado = await pool.query(
      `
      SELECT id
      FROM registros
      WHERE prestador_id = $1
      AND hora_salida IS NULL
      ORDER BY id DESC
      LIMIT 1
      `,
      [prestador_id]
    );

    if (abiertoResultado.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya tienes una entrada abierta. Primero debes marcar salida."
      });
    }

    await pool.query(
      `
      INSERT INTO registros
      (prestador_id, fecha, hora_entrada, actividad)
      VALUES ($1, $2, $3, $4)
      `,
      [prestador_id, fecha, horaEntrada, actividad || ""]
    );

    res.json({
      mensaje: "Entrada registrada correctamente.",
      hora_entrada: horaEntrada
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al registrar entrada."
    });
  }
});

/* MARCAR SALIDA */

app.post("/api/salida", async (req, res) => {
  try {
    const { prestador_id } = req.body;

    if (!prestador_id) {
      return res.status(400).json({
        mensaje: "Debes seleccionar un prestador."
      });
    }

    const horaSalida = obtenerHoraActual();

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre, estatus
      FROM prestadores
      WHERE id = $1
      `,
      [prestador_id]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const prestador = prestadorResultado.rows[0];

    if (prestador.estatus === "finalizado") {
      return res.status(403).json({
        mensaje: "No puedes registrar salida porque este prestador ya finalizó su servicio."
      });
    }

    const registroResultado = await pool.query(
      `
      SELECT id, hora_entrada
      FROM registros
      WHERE prestador_id = $1
      AND hora_salida IS NULL
      ORDER BY id DESC
      LIMIT 1
      `,
      [prestador_id]
    );

    if (registroResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "No tienes una entrada abierta para registrar salida."
      });
    }

    const registro = registroResultado.rows[0];
    const horas = calcularHoras(registro.hora_entrada, horaSalida);

    if (horas <= 0) {
      return res.status(400).json({
        mensaje: "La hora de salida debe ser mayor que la hora de entrada."
      });
    }

    await pool.query(
      `
      UPDATE registros
      SET hora_salida = $1, horas = $2
      WHERE id = $3
      `,
      [horaSalida, horas, registro.id]
    );

    res.json({
      mensaje: "Salida registrada correctamente.",
      hora_salida: horaSalida,
      horas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al registrar salida."
    });
  }
});

/* REGISTRO MANUAL */

app.post("/api/registro-manual", async (req, res) => {
  try {
    const { prestador_id, fecha, hora_entrada, hora_salida, actividad } = req.body;

    if (!prestador_id) {
      return res.status(400).json({
        mensaje: "Debes seleccionar un prestador."
      });
    }

    if (!fecha) {
      return res.status(400).json({
        mensaje: "Debes seleccionar una fecha."
      });
    }

    if (fechaEsFutura(fecha)) {
      return res.status(400).json({
        mensaje: "No puedes registrar horas en una fecha futura."
      });
    }

    if (!hora_entrada || !hora_salida) {
      return res.status(400).json({
        mensaje: "Debes seleccionar hora de entrada y hora de salida."
      });
    }

    const horas = calcularHoras(hora_entrada, hora_salida);

    if (horas <= 0) {
      return res.status(400).json({
        mensaje: "La hora de salida debe ser mayor que la hora de entrada."
      });
    }

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre, estatus
      FROM prestadores
      WHERE id = $1
      `,
      [prestador_id]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const prestador = prestadorResultado.rows[0];

    if (prestador.estatus === "finalizado") {
      return res.status(403).json({
        mensaje: "No puedes agregar horas porque este prestador ya finalizó su servicio."
      });
    }

    const cruceResultado = await pool.query(
      `
      SELECT id
      FROM registros
      WHERE prestador_id = $1
      AND fecha = $2
      AND hora_entrada < $3
      AND hora_salida > $4
      LIMIT 1
      `,
      [prestador_id, fecha, hora_salida, hora_entrada]
    );

    if (cruceResultado.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe un registro que se cruza con ese horario."
      });
    }

    await pool.query(
      `
      INSERT INTO registros
      (prestador_id, fecha, hora_entrada, hora_salida, horas, actividad)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [prestador_id, fecha, hora_entrada, hora_salida, horas, actividad || ""]
    );

    res.json({
      mensaje: "Registro manual guardado correctamente.",
      horas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al guardar el registro manual."
    });
  }
});

/* RESUMEN DEL PRESTADOR */

app.get("/api/resumen/:id", async (req, res) => {
  try {
    const prestadorId = req.params.id;

    const resumenResultado = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        p.matricula,
        p.carrera,
        p.horario,
        p.horas_requeridas,
        p.estatus,
        COALESCE(SUM(r.horas), 0) AS horas_acumuladas,
        p.horas_requeridas - COALESCE(SUM(r.horas), 0) AS horas_faltantes
      FROM prestadores p
      LEFT JOIN registros r ON p.id = r.prestador_id
      WHERE p.id = $1
      GROUP BY p.id
      `,
      [prestadorId]
    );

    if (resumenResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const registrosResultado = await pool.query(
      `
      SELECT
        id,
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(hora_entrada, 'HH24:MI') AS hora_entrada,
        TO_CHAR(hora_salida, 'HH24:MI') AS hora_salida,
        horas,
        actividad
      FROM registros
      WHERE prestador_id = $1
      ORDER BY fecha DESC, id DESC
      LIMIT 10
      `,
      [prestadorId]
    );

    res.json({
      resumen: resumenResultado.rows[0],
      registros: registrosResultado.rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener resumen."
    });
  }
});

/* RESUMEN DEL RESPONSABLE */

app.get("/api/profesor/resumen", async (req, res) => {
  try {
    const fecha = obtenerFechaActual();

    const resultado = await pool.query(
      `
      SELECT
        p.id,
        p.nombre,
        p.matricula,
        p.carrera,
        p.horario,
        p.horas_requeridas,
        p.estatus,
        COALESCE(SUM(r.horas), 0) AS horas_acumuladas,
        p.horas_requeridas - COALESCE(SUM(r.horas), 0) AS horas_faltantes,
        (
          SELECT
            CASE
              WHEN r2.hora_entrada IS NOT NULL AND r2.hora_salida IS NULL THEN 'Entrada registrada'
              WHEN r2.hora_entrada IS NOT NULL AND r2.hora_salida IS NOT NULL THEN 'Salida registrada'
              ELSE 'Sin registro hoy'
            END
          FROM registros r2
          WHERE r2.prestador_id = p.id
          AND r2.fecha = $1
          ORDER BY r2.id DESC
          LIMIT 1
        ) AS estado_hoy
      FROM prestadores p
      LEFT JOIN registros r ON p.id = r.prestador_id
      GROUP BY p.id
      ORDER BY p.nombre ASC
      `,
      [fecha]
    );

    const filas = resultado.rows.map((item) => ({
      ...item,
      estado_hoy: item.estado_hoy || "Sin registro hoy"
    }));

    res.json(filas);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener resumen del profesor."
    });
  }
});

/* HISTORIAL RESPONSABLE */

app.get("/api/profesor/prestador/:id/registros", async (req, res) => {
  try {
    const prestadorId = req.params.id;

    const resultado = await pool.query(
      `
      SELECT
        id,
        TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
        TO_CHAR(hora_entrada, 'HH24:MI') AS hora_entrada,
        TO_CHAR(hora_salida, 'HH24:MI') AS hora_salida,
        horas,
        actividad
      FROM registros
      WHERE prestador_id = $1
      ORDER BY fecha DESC, id DESC
      `,
      [prestadorId]
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener historial del prestador."
    });
  }
});

/* EDITAR REGISTRO */

app.put("/api/registros/:id", async (req, res) => {
  try {
    const registroId = req.params.id;
    const { fecha, hora_entrada, hora_salida, actividad } = req.body;

    if (!fecha) {
      return res.status(400).json({
        mensaje: "Debes seleccionar una fecha."
      });
    }

    if (fechaEsFutura(fecha)) {
      return res.status(400).json({
        mensaje: "No puedes usar una fecha futura."
      });
    }

    if (!hora_entrada || !hora_salida) {
      return res.status(400).json({
        mensaje: "Debes seleccionar hora de entrada y hora de salida."
      });
    }

    const horas = calcularHoras(hora_entrada, hora_salida);

    if (horas <= 0) {
      return res.status(400).json({
        mensaje: "La hora de salida debe ser mayor que la hora de entrada."
      });
    }

    const registroActualResultado = await pool.query(
      `
      SELECT id, prestador_id
      FROM registros
      WHERE id = $1
      `,
      [registroId]
    );

    if (registroActualResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Registro no encontrado."
      });
    }

    const registroActual = registroActualResultado.rows[0];

    const cruceResultado = await pool.query(
      `
      SELECT id
      FROM registros
      WHERE prestador_id = $1
      AND fecha = $2
      AND hora_entrada < $3
      AND hora_salida > $4
      AND id != $5
      LIMIT 1
      `,
      [
        registroActual.prestador_id,
        fecha,
        hora_salida,
        hora_entrada,
        registroId
      ]
    );

    if (cruceResultado.rows.length > 0) {
      return res.status(409).json({
        mensaje: "Ya existe otro registro que se cruza con ese horario."
      });
    }

    await pool.query(
      `
      UPDATE registros
      SET fecha = $1, hora_entrada = $2, hora_salida = $3, horas = $4, actividad = $5
      WHERE id = $6
      `,
      [fecha, hora_entrada, hora_salida, horas, actividad || "", registroId]
    );

    res.json({
      mensaje: "Registro actualizado correctamente.",
      horas
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al actualizar el registro."
    });
  }
});

/* ELIMINAR REGISTRO INDIVIDUAL */

app.delete("/api/registros/:id", async (req, res) => {
  try {
    const registroId = req.params.id;

    const resultado = await pool.query(
      `
      DELETE FROM registros
      WHERE id = $1
      RETURNING id
      `,
      [registroId]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Registro no encontrado."
      });
    }

    res.json({
      mensaje: "Registro eliminado correctamente."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al eliminar el registro."
    });
  }
});

/* FINALIZAR PRESTADOR */

app.patch("/api/prestadores/:id/finalizar", async (req, res) => {
  try {
    const prestadorId = req.params.id;

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre, estatus
      FROM prestadores
      WHERE id = $1
      `,
      [prestadorId]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const prestador = prestadorResultado.rows[0];

    if (prestador.estatus === "finalizado") {
      return res.status(409).json({
        mensaje: "Este prestador ya está marcado como finalizado."
      });
    }

    await pool.query(
      `
      UPDATE prestadores
      SET estatus = 'finalizado'
      WHERE id = $1
      `,
      [prestadorId]
    );

    res.json({
      mensaje: "Prestador marcado como finalizado correctamente."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al finalizar prestador."
    });
  }
});

/* REACTIVAR PRESTADOR */

app.patch("/api/prestadores/:id/activar", async (req, res) => {
  try {
    const prestadorId = req.params.id;

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre, estatus
      FROM prestadores
      WHERE id = $1
      `,
      [prestadorId]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const prestador = prestadorResultado.rows[0];

    if (prestador.estatus === "activo") {
      return res.status(409).json({
        mensaje: "Este prestador ya se encuentra activo."
      });
    }

    await pool.query(
      `
      UPDATE prestadores
      SET estatus = 'activo'
      WHERE id = $1
      `,
      [prestadorId]
    );

    res.json({
      mensaje: "Prestador reactivado correctamente."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al reactivar prestador."
    });
  }
});

/* BORRAR REGISTROS DEL PRESTADOR */

app.delete("/api/prestadores/:id/registros", async (req, res) => {
  try {
    const prestadorId = req.params.id;

    const prestadorResultado = await pool.query(
      `
      SELECT id, nombre
      FROM prestadores
      WHERE id = $1
      `,
      [prestadorId]
    );

    if (prestadorResultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Prestador no encontrado."
      });
    }

    const totalResultado = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM registros
      WHERE prestador_id = $1
      `,
      [prestadorId]
    );

    const total = Number(totalResultado.rows[0].total);

    if (total === 0) {
      return res.status(409).json({
        mensaje: "Este prestador no tiene registros para eliminar."
      });
    }

    const deleteResultado = await pool.query(
      `
      DELETE FROM registros
      WHERE prestador_id = $1
      RETURNING id
      `,
      [prestadorId]
    );

    res.json({
      mensaje: "Registros del prestador borrados correctamente.",
      registros_eliminados: deleteResultado.rows.length
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al borrar registros del prestador."
    });
  }
});

/* PRUEBA */

app.get("/api/prueba", (req, res) => {
  res.json({
    mensaje: "Servidor funcionando correctamente"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});