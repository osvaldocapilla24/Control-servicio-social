const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

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
    fecha_registro TEXT NOT NULL,
    estatus TEXT DEFAULT 'activo'
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

db.all("PRAGMA table_info(prestadores)", [], (error, columnas) => {
  if (error) {
    console.error("Error al revisar columnas:", error.message);
    return;
  }

  const existeEstatus = columnas.some((columna) => columna.name === "estatus");

  if (!existeEstatus) {
    db.run("ALTER TABLE prestadores ADD COLUMN estatus TEXT DEFAULT 'activo'", (error) => {
      if (error) {
        console.error("Error al agregar columna estatus:", error.message);
      } else {
        console.log("Columna estatus agregada correctamente.");
      }
    });
  }
});

function obtenerFechaActual() {
  const fechaMexico = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Mexico_City"
  });

  return fechaMexico;
}

function fechaEsFutura(fecha) {
  const hoy = obtenerFechaActual();
  return fecha > hoy;
}

app.post("/api/prestadores", (req, res) => {
  let { nombre, matricula, carrera, horario, horas_requeridas } = req.body;

  nombre = nombre ? nombre.trim() : "";
  matricula = matricula ? matricula.trim() : "";
  carrera = carrera ? carrera.trim() : "";
  horario = horario ? horario.trim() : "";
  horas_requeridas = Number(horas_requeridas);

  if (!nombre) {
    return res.status(400).json({
      mensaje: "El nombre es obligatorio."
    });
  }

  if (!matricula) {
    return res.status(400).json({
      mensaje: "La matrícula es obligatoria."
    });
  }

  if (!carrera) {
    return res.status(400).json({
      mensaje: "La carrera es obligatoria."
    });
  }

  if (!horario) {
    return res.status(400).json({
      mensaje: "El horario es obligatorio."
    });
  }

  if (!horas_requeridas || horas_requeridas <= 0) {
    return res.status(400).json({
      mensaje: "Las horas requeridas deben ser mayor a 0."
    });
  }

  const fechaRegistro = obtenerFechaActual();

  db.run(
    `
    INSERT INTO prestadores 
    (nombre, matricula, carrera, horario, horas_requeridas, fecha_registro, estatus)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      nombre,
      matricula,
      carrera,
      horario,
      horas_requeridas,
      fechaRegistro,
      "activo"
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
  return new Date().toLocaleTimeString("en-GB", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
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

app.get("/api/prestadores/buscar/:texto", (req, res) => {
  const texto = req.params.texto.trim();

  if (!texto) {
    return res.status(400).json({
      mensaje: "Debes escribir un nombre o matrícula."
    });
  }

  db.get(
    `
    SELECT id, nombre, matricula, carrera, horario, horas_requeridas, estatus
    FROM prestadores
    WHERE matricula = ?
    OR nombre LIKE ?
    LIMIT 1
    `,
    [texto, `%${texto}%`],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al buscar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "No se encontró ningún prestador con ese nombre o matrícula."
        });
      }

      res.json({
        mensaje: "Prestador encontrado.",
        prestador
      });
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
    SELECT id, nombre, estatus
    FROM prestadores
    WHERE id = ?
    `,
    [prestador_id],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      if (prestador.estatus === "finalizado") {
        return res.status(403).json({
          mensaje: "No puedes registrar entrada porque este prestador ya finalizó su servicio."
        });
      }

      db.get(
        `
        SELECT * FROM registros
        WHERE prestador_id = ?
        AND hora_salida IS NULL
        ORDER BY id DESC
        LIMIT 1
        `,
        [prestador_id],
        (error, registroAbierto) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al verificar registro."
            });
          }

          if (registroAbierto) {
            return res.status(409).json({
              mensaje: "Ya tienes una entrada abierta. Primero debes marcar salida."
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
    SELECT id, nombre, estatus
    FROM prestadores
    WHERE id = ?
    `,
    [prestador_id],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      if (prestador.estatus === "finalizado") {
        return res.status(403).json({
          mensaje: "No puedes registrar salida porque este prestador ya finalizó su servicio."
        });
      }

      db.get(
        `
        SELECT * FROM registros
        WHERE prestador_id = ?
        AND hora_salida IS NULL
        ORDER BY id DESC
        LIMIT 1
        `,
        [prestador_id],
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

          if (horas <= 0) {
            return res.status(400).json({
              mensaje: "La hora de salida debe ser mayor que la hora de entrada."
            });
          }

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
    }
  );
});

app.post("/api/registro-manual", (req, res) => {
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

  db.get(
    `
    SELECT id, nombre, estatus
    FROM prestadores
    WHERE id = ?
    `,
    [prestador_id],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      if (prestador.estatus === "finalizado") {
        return res.status(403).json({
          mensaje: "No puedes agregar horas porque este prestador ya finalizó su servicio."
        });
      }

      db.get(
        `
        SELECT id
        FROM registros
        WHERE prestador_id = ?
        AND fecha = ?
        AND hora_entrada < ?
        AND hora_salida > ?
        LIMIT 1
        `,
        [prestador_id, fecha, hora_entrada, hora_salida],
        (error, registroDuplicado) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al verificar registros duplicados."
            });
          }

          if (registroDuplicado) {
            return res.status(409).json({
              mensaje: "Ya existe un registro con ese horario"
            });
          }

          db.run(
            `
            INSERT INTO registros
            (prestador_id, fecha, hora_entrada, hora_salida, horas, actividad)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [prestador_id, fecha, hora_entrada, hora_salida, horas, actividad || ""],
            function (error) {
              if (error) {
                return res.status(500).json({
                  mensaje: "Error al guardar el registro manual."
                });
              }

              res.json({
                mensaje: "Registro manual guardado correctamente.",
                horas
              });
            }
          );
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
        SELECT id, fecha, hora_entrada, hora_salida, horas, actividad
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

app.get("/api/profesor/resumen", (req, res) => {
  const fecha = obtenerFechaActual();

  db.all(
    `
    SELECT 
      p.id,
      p.nombre,
      p.matricula,
      p.carrera,
      p.horario,
      p.horas_requeridas,
      p.estatus,
      IFNULL(SUM(r.horas), 0) AS horas_acumuladas,
      p.horas_requeridas - IFNULL(SUM(r.horas), 0) AS horas_faltantes,
      (
        SELECT 
          CASE 
            WHEN r2.hora_entrada IS NOT NULL AND r2.hora_salida IS NULL THEN 'Entrada registrada'
            WHEN r2.hora_entrada IS NOT NULL AND r2.hora_salida IS NOT NULL THEN 'Salida registrada'
            ELSE 'Sin registro hoy'
          END
        FROM registros r2
        WHERE r2.prestador_id = p.id 
        AND r2.fecha = ?
        ORDER BY r2.id DESC
        LIMIT 1
      ) AS estado_hoy
    FROM prestadores p
    LEFT JOIN registros r ON p.id = r.prestador_id
    GROUP BY p.id
    ORDER BY p.nombre ASC
    `,
    [fecha],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al obtener resumen del profesor."
        });
      }

      const resultado = rows.map((item) => ({
        ...item,
        estado_hoy: item.estado_hoy || "Sin registro hoy"
      }));

      res.json(resultado);
    }
  );
});

app.get("/api/profesor/prestador/:id/registros", (req, res) => {
  const prestadorId = req.params.id;

  db.all(
    `
    SELECT
      id,
      fecha,
      hora_entrada,
      hora_salida,
      horas,
      actividad
    FROM registros
    WHERE prestador_id = ?
    ORDER BY fecha DESC, id DESC
    `,
    [prestadorId],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al obtener historial del prestador."
        });
      }

      res.json(rows);
    }
  );
});

app.put("/api/registros/:id", (req, res) => {
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

  db.get(
    `
    SELECT id, prestador_id
    FROM registros
    WHERE id = ?
    `,
    [registroId],
    (error, registroActual) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al buscar el registro."
        });
      }

      if (!registroActual) {
        return res.status(404).json({
          mensaje: "Registro no encontrado."
        });
      }

      db.get(
        `
        SELECT id
        FROM registros
        WHERE prestador_id = ?
        AND fecha = ?
        AND hora_entrada < ?
        AND hora_salida > ?
        AND id != ?
        LIMIT 1
        `,
        [
          registroActual.prestador_id,
          fecha,
          hora_entrada,
          hora_salida,
          registroId
        ],
        (error, registroDuplicado) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al verificar registros duplicados."
            });
          }

          if (registroDuplicado) {
            return res.status(409).json({
              mensaje: "Ya existe otro registro con la misma fecha, entrada y salida."
            });
          }

          db.run(
            `
            UPDATE registros
            SET fecha = ?, hora_entrada = ?, hora_salida = ?, horas = ?, actividad = ?
            WHERE id = ?
            `,
            [fecha, hora_entrada, hora_salida, horas, actividad || "", registroId],
            function (error) {
              if (error) {
                return res.status(500).json({
                  mensaje: "Error al actualizar el registro."
                });
              }

              res.json({
                mensaje: "Registro actualizado correctamente.",
                horas
              });
            }
          );
        }
      );
    }
  );
});
app.delete("/api/registros/:id", (req, res) => {
  const registroId = req.params.id;

  db.run(
    `
    DELETE FROM registros
    WHERE id = ?
    `,
    [registroId],
    function (error) {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al eliminar el registro."
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          mensaje: "Registro no encontrado."
        });
      }

      res.json({
        mensaje: "Registro eliminado correctamente."
      });
    }
  );
});

app.patch("/api/prestadores/:id/finalizar", (req, res) => {
  const prestadorId = req.params.id;

  db.get(
    `
    SELECT id, nombre, estatus
    FROM prestadores
    WHERE id = ?
    `,
    [prestadorId],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      if (prestador.estatus === "finalizado") {
        return res.status(409).json({
          mensaje: "Este prestador ya está marcado como finalizado."
        });
      }

      db.run(
        `
        UPDATE prestadores
        SET estatus = 'finalizado'
        WHERE id = ?
        `,
        [prestadorId],
        function (error) {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al finalizar prestador."
            });
          }

          res.json({
            mensaje: "Prestador marcado como finalizado correctamente."
          });
        }
      );
    }
  );
});

app.patch("/api/prestadores/:id/activar", (req, res) => {
  const prestadorId = req.params.id;

  db.get(
    `
    SELECT id, nombre, estatus
    FROM prestadores
    WHERE id = ?
    `,
    [prestadorId],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      if (prestador.estatus === "activo") {
        return res.status(409).json({
          mensaje: "Este prestador ya se encuentra activo."
        });
      }

      db.run(
        `
        UPDATE prestadores
        SET estatus = 'activo'
        WHERE id = ?
        `,
        [prestadorId],
        function (error) {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al reactivar prestador."
            });
          }

          res.json({
            mensaje: "Prestador reactivado correctamente."
          });
        }
      );
    }
  );
});

app.delete("/api/prestadores/:id/registros", (req, res) => {
  const prestadorId = req.params.id;

  db.get(
    `
    SELECT id, nombre
    FROM prestadores
    WHERE id = ?
    `,
    [prestadorId],
    (error, prestador) => {
      if (error) {
        return res.status(500).json({
          mensaje: "Error al verificar prestador."
        });
      }

      if (!prestador) {
        return res.status(404).json({
          mensaje: "Prestador no encontrado."
        });
      }

      db.get(
        `
        SELECT COUNT(*) AS total
        FROM registros
        WHERE prestador_id = ?
        `,
        [prestadorId],
        (error, resultado) => {
          if (error) {
            return res.status(500).json({
              mensaje: "Error al revisar registros del prestador."
            });
          }

          if (resultado.total === 0) {
            return res.status(409).json({
              mensaje: "Este prestador no tiene registros para eliminar."
            });
          }

          db.run(
            `
            DELETE FROM registros
            WHERE prestador_id = ?
            `,
            [prestadorId],
            function (error) {
              if (error) {
                return res.status(500).json({
                  mensaje: "Error al borrar registros del prestador."
                });
              }

              res.json({
                mensaje: "Registros del prestador borrados correctamente.",
                registros_eliminados: this.changes
              });
            }
          );
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