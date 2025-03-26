require('dotenv').config();

// Verificar que las variables están cargadas correctamente
console.log("DB Host:", process.env.DB_HOST);
console.log("DB User:", process.env.DB_USER);
console.log("DB Password:", process.env.DB_PASSWORD);
console.log("DB Name:", process.env.DB_NAME);

const express = require("express");
const { Pool } = require('pg'); // Usamos el paquete `pg` para PostgreSQL
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const SibApiV3Sdk = require("sib-api-v3-sdk");

// Configura la API de Brevo (SendinBlue)
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = process.env.BREVO_API_KEY;

SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = apiKey;

const app = express();

// Inicialización de middlewares
app.use(cors()); // Para permitir solicitudes de dominios cruzados
app.use(express.json()); // Para poder manejar datos JSON

app.use("/css", express.static(path.join(__dirname, "../css"))); // ruta para archivos CSS
app.use("/javascript", express.static(path.join(__dirname, "../javascript"))); // ruta para archivos JS
app.use("/html", express.static(path.join(__dirname, "../html"))); // ruta para archivos JS
app.use("/imagenes", express.static(path.join(__dirname, "../imagenes"))); // ruta para archivos JS
// Ruta raíz (cuando entras al dominio)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/index.html"));
});

app.get('/Principal.html', (req, res) => {
  res.sendFile(path.join(__dirname, "../html/Principal.html"));
});

// Conexión a la base de datos PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },  // Si tu conexión requiere SSL
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Error en la conexión a la BD:", err.stack);
    return;
  }
  console.log("✅ Conexión exitosa a la base de datos");
  release();
});

// Puerto dinámico para Render (o 3000 si estamos en local)
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});


app.post("/login", (req, res) => {
  const { usuario, contrasena } = req.body;

  // Usamos una consulta SQL con PostgreSQL (pg)
  const query = "SELECT * FROM usuarios WHERE usuario = $1 AND contrasena = $2";

  // Ejecutamos la consulta
  pool.query(query, [usuario, contrasena], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la consulta" });

    if (results.rows.length > 0) {
      res.json({ message: "Login exitoso", user: results.rows[0] });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });
});

// REGISTRO
app.post("/usuarios", (req, res) => {
  const { usuario, contrasena, nombre, apellidos, correo, celular } = req.body;
  const query =
    "INSERT INTO usuarios (usuario, contrasena, nombre, apellidos, correo, celular) VALUES ($1, $2, $3, $4, $5, $6)";
  pool
    .query(query, [usuario, contrasena, nombre, apellidos, correo, celular])
    .then(() => res.json({ message: "Usuario registrado exitosamente" }))
    .catch((err) => res.status(400).json({ error: "Usuario ya registrado" }));
});

app.post("/verificarUsuario", (req, res) => {
  const { usuario } = req.body;
  pool
    .query("SELECT * FROM usuarios WHERE usuario = $1", [usuario])
    .then((results) => res.json({ valid: results.rows.length === 0 }))
    .catch((err) => res.status(500).json({ error: "Error en la consulta" }));
});

app.post("/verificarCorreo", (req, res) => {
  const { correo } = req.body;
  pool
    .query("SELECT * FROM usuarios WHERE correo = $1", [correo])
    .then((results) => res.json({ valid: results.rows.length === 0 }))
    .catch((err) => res.status(500).json({ error: "Error en la consulta" }));
});

app.post("/actualizarContrasena", (req, res) => {
  const { contrasena, correo } = req.body;
  pool
    .query("UPDATE usuarios SET contrasena = $1 WHERE correo = $2", [contrasena, correo])
    .then(() => res.json({ success: true }))
    .catch((err) => res.status(500).json({ error: "Error al actualizar" }));
});

// ENVIAR CORREO RECUPERACIÓN / VERIFICACIÓN
app.post("/generarCorreo", enviarCorreo);
app.post("/generarCorreoVerificacion", enviarCorreoVerificacion);

function enviarCorreo(req, res) {
  const { correo, codigo } = req.body;
  const sendSmtpEmail = {
    subject: "Recuperación de Contraseña",
    htmlContent: `
      <div style="font-family: Arial; text-align: center;">
        <h2>Recuperación de Contraseña</h2>
        <p>Tu código es: <strong style="font-size: 20px;">${codigo}</strong></p>
      </div>`,
    sender: { name: "FacturaFast", email: "facturafastcr@gmail.com" },
    to: [{ email: correo }],
  };

  apiInstance.sendTransacEmail(sendSmtpEmail)
    .then(() => res.json({ message: "Correo enviado" }))
    .catch((error) => {
      console.error("Error al enviar correo:", error);
      res.status(500).json({ error: "No se pudo enviar el correo" });
    });
}

function enviarCorreoVerificacion(req, res) {
  const { correo, codigo } = req.body;
  const sendSmtpEmail = {
    subject: "Verificación de cuenta",
    htmlContent: `
      <div style="font-family: Arial; text-align: center;">
        <h2>Verificación de cuenta</h2>
        <p>Tu código es: <strong style="font-size: 20px;">${codigo}</strong></p>
      </div>`,
    sender: { name: "FacturaFast", email: "facturafastcr@gmail.com" },
    to: [{ email: correo }],
  };

  apiInstance.sendTransacEmail(sendSmtpEmail)
    .then(() => res.json({ message: "Correo enviado" }))
    .catch((error) => {
      console.error("Error al enviar correo:", error);
      res.status(500).json({ error: "No se pudo enviar el correo" });
    });
}

// PRODUCTOS
app.post("/guardarProductos", (req, res) => {
  const { nombre, descripcion, cantidad, precio, usuario } = req.body;
  const query =
    "INSERT INTO productos (nombre, descripcion, cantidad, precio, idusuario) VALUES ($1, $2, $3, $4, $5)";
  pool
    .query(query, [nombre, descripcion, cantidad, precio, usuario])
    .then(() => res.json({ message: "Producto guardado" }))
    .catch((err) => res.status(500).json({ error: "Error al guardar producto" }));
});

app.post("/editar", (req, res) => {
  const { nombre, descripcion, cantidad, precio, idTemp } = req.body;
  const query =
    "UPDATE productos SET nombre = $1, descripcion = $2, cantidad = $3, precio = $4 WHERE idproducto = $5";
  pool
    .query(query, [nombre, descripcion, cantidad, precio, idTemp])
    .then(() => res.json({ message: "Producto editado" }))
    .catch((err) => res.status(500).json({ error: "Error al editar producto" }));
});

app.post("/productos", (req, res) => {
  const { usuario } = req.body;
  
  // Cambiar 'usuario' por 'idusuario' si la columna correcta es idusuario
  pool
    .query("SELECT * FROM productos WHERE idusuario = $1", [usuario])
    .then((results) => {
      console.log("Productos obtenidos:", results.rows);  // Para depuración
      res.json(results.rows);
    })
    .catch((err) => res.status(500).json({ error: "Error al obtener productos", details: err }));
});

app.post("/editarMostrar", (req, res) => {
  const { idProducto } = req.body;
  pool
    .query("SELECT * FROM productos WHERE idproducto = $1", [idProducto])
    .then((results) => res.json({ producto: results.rows[0] }))
    .catch((err) => res.status(500).json({ error: "Error al obtener el producto" }));
});

app.post("/eliminarProducto", (req, res) => {
  const { idProducto } = req.body;
  pool
    .query("DELETE FROM productos WHERE idproducto = $1", [idProducto])
    .then(() => res.json({ message: "Producto eliminado" }))
    .catch((err) => res.status(500).json({ error: "Error al eliminar el producto" }));
});

// FACTURACIÓN
app.post("/generarFactura", (req, res) => {
  const { fecha, montoTotal } = req.body;
  pool
    .query("INSERT INTO facturas (fecha, montototal) VALUES ($1, $2)", [fecha, montoTotal])
    .then(() => res.json({ message: "Factura creada" }))
    .catch((err) => res.status(500).json({ error: "Error al crear factura" }));
});

app.post("/obtenerUltimo", (req, res) => {
  pool
    .query("SELECT idfactura FROM facturas ORDER BY idfactura DESC LIMIT 1")
    .then((results) => res.json(results.rows))
    .catch((err) => res.status(500).json({ error: "Error al obtener última factura" }));
});

app.post("/generarFacturaDetallada", (req, res) => {
  const { idProducto, monto, cantidad, fkFactura, fkUsuario } = req.body;
  const query =
    "INSERT INTO facturasdetalladas (idproducto, monto, cantidad, fkfactura, fkusuario) VALUES ($1, $2, $3, $4, $5)";
  pool
    .query(query, [idProducto, monto, cantidad, fkFactura, fkUsuario])
    .then(() => res.json({ message: "Detalle agregado" }))
    .catch((err) => res.status(500).json({ error: "Error al agregar detalle" }));
});

// PDF Generación
app.post("/generarPDF", (req, res) => {
  const { idFactura, fecha, montoTotal, productos } = req.body;

  const doc = new PDFDocument();
  const filePath = path.join(__dirname, `factura_${idFactura}.pdf`);
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(18).text(`Factura #${idFactura}`, { align: "center" });
  doc.fontSize(12).text(`Fecha: ${fecha}`);
  doc.moveDown();

  productos.forEach(p => {
    doc.text(`${p.nombre} - Cantidad: ${p.cantidad} - Total: $${p.monto.toFixed(2)}`);
  });

  doc.moveDown().text(`Monto total: $${montoTotal.toFixed(2)}`, { align: "right" });
  doc.end();

  stream.on("finish", () => {
    res.sendFile(filePath, () => fs.unlinkSync(filePath));
  });
});

// STATS
app.get("/obtenerFacturas", (_, res) => {
  pool
    .query("SELECT * FROM facturas")
    .then((results) => res.json(results.rows))
    .catch((err) => res.status(500).json({ error: "Error" }));
});

app.get("/mayorProductoVendido", (_, res) => {
  const query = `
    SELECT p.nombre, SUM(fd.cantidad) AS totalvendido
    FROM facturasdetalladas fd
    JOIN productos p ON fd.fkproducto = p.idproducto
    GROUP BY p.nombre
    ORDER BY totalvendido DESC LIMIT 5`;

  pool
    .query(query)
    .then((results) => res.json(results.rows))
    .catch((err) => res.status(500).json({ error: "Error al obtener los productos más vendidos", details: err }));
});

app.get("/ventasMensuales", (_, res) => {
  const query = `
    SELECT TO_CHAR(fecha, 'YYYY-MM') AS fecha, SUM(montototal) AS total
    FROM facturas
    GROUP BY TO_CHAR(fecha, 'YYYY-MM')
    ORDER BY fecha DESC`; // Agrupamos correctamente por año y mes, y ordenamos de forma descendente

  pool
    .query(query)
    .then((results) => res.json(results.rows))
    .catch((err) => {
      console.error("Error al obtener las ventas mensuales", err);
      res.status(500).json({ error: "Error al obtener las ventas mensuales", details: err });
    });
});

app.get("/ventasSemanales", (_, res) => {
  const query = `
    SELECT SUM(montototal) AS total
    FROM facturas
    WHERE fecha >= CURRENT_DATE - INTERVAL '7 days'`;
  pool
    .query(query)
    .then((results) => res.json(results.rows))
    .catch((err) => res.status(500).json({ error: "Error" }));
});


