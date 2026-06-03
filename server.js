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

app.get("/api/prueba", (req, res) => {
  res.json({
    mensaje: "Servidor funcionando correctamente"
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});