const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const db = new sqlite3.Database("./servicio_social.db", (error) => {
  if (error) {
    console.error("Error al conectar con SQLite:", error.message);
  } else {
    console.log("Base de datos conectada correctamente.");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS prestadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      matricula TEXT NOT NULL UNIQUE,
      carrera TEXT NOT NULL,
      horario TEXT NOT NULL,
      horas_requeridas REAL DEFAULT 480,
      fecha_registro TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prestador_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora_entrada TEXT,
      hora_salida TEXT,
      horas REAL DEFAULT 0,
      actividad TEXT,
      FOREIGN KEY (prestador_id) REFERENCES prestadores(id)
    )
  `);
});

function obtenerFechaActual() {
  return new Date().toISOString().split("T")[0];
}

app.post("/api/prestadores", (req, res) => {
  const { nombre, matricula, carrera, horario, horas_requeridas } = req.body;

  if (!nombre || !matricula || !carrera || !horario) {
    return res.status(400).json({
      mensaje: "Todos los campos son obligatorios."
    });
  }

  const fechaRegistro = obtenerFechaActual();

  db.run(
    `
    INSERT INTO prestadores 
    (nombre, matricula, carrera, horario, horas_requeridas, fecha_registro)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      nombre,
      matricula,
      carrera,
      horario,
      horas_requeridas || 480,
      fechaRegistro
    ],
    function (error) {
      if (error) {
        if (error.message.includes("UNIQUE")) {
          return res.status(409).json({
            mensaje: "Ya existe un prestador registrado con esa matrícula."
          });
        }

        return res.status(500).json({
          mensaje: "Error al registrar prestador."
        });
      }

      res.json({
        mensaje: "Prestador registrado correctamente.",
        id: this.lastID
      });
    }
  );
});

function obtenerHoraActual() {
  return new Date().toTimeString().split(" ")[0].substring(0, 5);
}

function calcularHoras(horaEntrada, horaSalida) {
  const [h1, m1] = horaEntrada.split(":").map(Number);
  const [h2, m2] = horaSalida.split(":").map(Number);

  const entrada = h1 * 60 + m1;
  const salida = h2 * 60 + m2;

  const diferenciaMinutos = salida - entrada;

  if (diferenciaMinutos <= 0) {
    return 0;
  }

  return diferenciaMinutos / 60;
}

app.get("/api/prestadores", (req, res) => {
  db.all(
    `
    SELECT id, nombre, matricula, carrera, horario, horas_requeridas
    FROM prestadores
    ORDER BY nombre ASC
    `,
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al obtener prestadores."
        });
      }

      res.json(rows);
    }
  );
});

app.post("/api/entrada", (req, res) => {
  const { prestador_id, actividad } = req.body;

  if (!prestador_id) {
    return res.status(400).json({
      mensaje: "Debes seleccionar un prestador."
    });
  }

  const fecha = obtenerFechaActual();
  const horaEntrada = obtenerHoraActual();

  db.get(
    `
    SELECT * FROM registros
    WHERE prestador_id = ?
    AND fecha = ?
    AND hora_salida IS NULL
    `,
    [prestador_id, fecha],
    (error, registroAbierto) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar registro."
        });
      }

      if (registroAbierto) {
        return res.status(409).json({
          mensaje: "Ya tienes una entrada registrada sin salida."
        });
      }

      db.run(
        `
        INSERT INTO registros 
        (prestador_id, fecha, hora_entrada, actividad)
        VALUES (?, ?, ?, ?)
        `,
        [prestador_id, fecha, horaEntrada, actividad || ""],
        function (error) {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al registrar entrada."
            });
          }

          res.json({
            mensaje: "Entrada registrada correctamente.",
            hora_entrada: horaEntrada
          });
        }
      );
    }
  );
});

app.post("/api/salida", (req, res) => {
  const { prestador_id } = req.body;

  if (!prestador_id) {
    return res.status(400).json({
      mensaje: "Debes seleccionar un prestador."
    });
  }

  const fecha = obtenerFechaActual();
  const horaSalida = obtenerHoraActual();

  db.get(
    `
    SELECT * FROM registros
    WHERE prestador_id = ?
    AND fecha = ?
    AND hora_salida IS NULL
    ORDER BY id DESC
    LIMIT 1
    `,
    [prestador_id, fecha],
    (error, registro) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al buscar entrada."
        });
      }

      if (!registro) {
        return res.status(404).json({
          mensaje: "No tienes una entrada abierta para registrar salida."
        });
      }

      const horas = calcularHoras(registro.hora_entrada, horaSalida);

      db.run(
        `
        UPDATE registros
        SET hora_salida = ?, horas = ?
        WHERE id = ?
        `,
        [horaSalida, horas, registro.id],
        function (error) {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al registrar salida."
            });
          }

          res.json({
            mensaje: "Salida registrada correctamente.",
            hora_salida: horaSalida,
            horas
          });
        }
      );
    }
  );
});

app.get("/api/resumen/:id", (req, res) => {
  const prestadorId = req.params.id;

  db.get(
    `
    SELECT 
      p.id,
      p.nombre,
      p.matricula,
      p.carrera,
      p.horario,
      p.horas_requeridas,
      IFNULL(SUM(r.horas), 0) AS horas_acumuladas,
      p.horas_requeridas - IFNULL(SUM(r.horas), 0) AS horas_faltantes
    FROM prestadores p
    LEFT JOIN registros r ON p.id = r.prestador_id
    WHERE p.id = ?
    GROUP BY p.id
    `,
    [prestadorId],
    (error, resumen) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al obtener resumen."
        });
      }

      if (!resumen) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      db.all(
        `
        SELECT fecha, hora_entrada, hora_salida, horas, actividad
        FROM registros
        WHERE prestador_id = ?
        ORDER BY fecha DESC, id DESC
        LIMIT 10
        `,
        [prestadorId],
        (error, registros) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al obtener registros."
            });
          }

          res.json({
            resumen,
            registros
          });
        }
      );
    }
  );
});

app.get("/api/prueba", (req, res) => {
  res.json({
    mensaje: "Servidor funcionando correctamente"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});