require('dotenv').config();
const express = require("express");
const mysql = require('mysql2');
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// Servir archivos estáticos desde la carpeta "html"
app.use(express.static(path.join(__dirname, "../html")));

// Cuando el usuario entra a "/", enviar index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/index.html"));
});
const PDFDocument = require("pdfkit");
const brevo = require('@getbrevo/brevo');

// Inicialización
const app = express();
app.use(cors());
app.use(express.json());

// Configurar Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

// Configuración de la BD
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("❌ Error en la conexión a la BD:", err);
  } else {
    console.log("✅ Conexión exitosa a la base de datos");
  }
});

// LOGIN
app.post("/login", (req, res) => {
  const { usuario, contrasena } = req.body;
  const query = "SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?";
  db.query(query, [usuario, contrasena], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la consulta" });
    if (results.length > 0) {
      res.json({ message: "Login exitoso", user: results[0] });
    } else {
      res.status(401).json({ error: "Credenciales inválidas" });
    }
  });
});

// REGISTRO
app.post("/usuarios", (req, res) => {
  const { usuario, contrasena, nombre, apellidos, correo, celular } = req.body;
  const query = "INSERT INTO usuarios (usuario, contrasena, nombre, apellidos, correo, celular) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [usuario, contrasena, nombre, apellidos, correo, celular], (err, result) => {
    if (err) return res.status(400).json({ error: "Usuario ya registrado" });
    res.json({ message: "Usuario registrado exitosamente" });
  });
});

// VERIFICAR USUARIO Y CORREO
app.post("/verificarUsuario", (req, res) => {
  const { usuario } = req.body;
  db.query("SELECT * FROM usuarios WHERE usuario = ?", [usuario], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la consulta" });
    res.json({ valid: results.length === 0 });
  });
});

app.post("/verificarCorreo", (req, res) => {
  const { correo } = req.body;
  db.query("SELECT * FROM usuarios WHERE correo = ?", [correo], (err, results) => {
    if (err) return res.status(500).json({ error: "Error en la consulta" });
    res.json({ valid: results.length === 0 });
  });
});

// ACTUALIZAR CONTRASEÑA
app.post("/actualizarContrasena", (req, res) => {
  const { contrasena, correo } = req.body;
  db.query("UPDATE usuarios SET contrasena = ? WHERE correo = ?", [contrasena, correo], (err, result) => {
    if (err) return res.status(500).json({ error: "Error al actualizar" });
    res.json({ success: true });
  });
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
    to: [{ email: correo }]
  };

  apiInstance.sendTransacEmail(sendSmtpEmail)
    .then(data => res.json({ message: "Correo enviado" }))
    .catch(error => {
      console.error("Error al enviar correo:", error);
      res.status(500).json({ error: "No se pudo enviar el correo" });
    });
}

function enviarCorreoVerificacion(req, res) {
    const { correo, codigo } = req.body;
    const sendSmtpEmail = {
      subject: "Verificacion de cuenta",
      htmlContent: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Verificacion de cuenta</h2>
          <p>Tu código es: <strong style="font-size: 20px;">${codigo}</strong></p>
        </div>`,
      sender: { name: "FacturaFast", email: "facturafastcr@gmail.com" },
      to: [{ email: correo }]
    };
  
    apiInstance.sendTransacEmail(sendSmtpEmail)
      .then(data => res.json({ message: "Correo enviado" }))
      .catch(error => {
        console.error("Error al enviar correo:", error);
        res.status(500).json({ error: "No se pudo enviar el correo" });
      });
  }

// PRODUCTOS
app.post("/guardarProductos", (req, res) => {
  const { nombre, descripcion, cantidad, precio, usuario } = req.body;
  const query = "INSERT INTO productos (nombre, descripcion, cantidad, precio, usuario) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [nombre, descripcion, cantidad, precio, usuario], (err, result) => {
    if (err) return res.status(500).json({ error: "Error al guardar producto" });
    res.json({ message: "Producto guardado" });
  });
});

app.post("/editar", (req, res) => {
  const { nombre, descripcion, cantidad, precio, idTemp } = req.body;
  db.query("UPDATE productos SET nombre=?, descripcion=?, cantidad=?, precio=? WHERE idProducto=?", 
  [nombre, descripcion, cantidad, precio, idTemp], (err) => {
    if (err) return res.status(500).json({ error: "Error al editar producto" });
    res.json({ message: "Producto editado" });
  });
});

app.post("/productos", (req, res) => {
  const { usuario } = req.body;
  db.query("SELECT * FROM productos WHERE usuario = ?", [usuario], (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.post("/editarMostrar", (req, res) => {
  const { idProducto } = req.body;
  db.query("SELECT * FROM productos WHERE idProducto = ?", [idProducto], (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json({ producto: results[0] });
  });
});

app.post("/elimarProducto", (req, res) => {
  const { idProducto } = req.body;
  db.query("DELETE FROM productos WHERE idProducto = ?", [idProducto], (err) => {
    if (err) return res.status(500).json({ error: "Error al eliminar" });
    res.json({ message: "Producto eliminado" });
  });
});

// FACTURACIÓN
app.post("/generarFactura", (req, res) => {
  const { fecha, montoTotal } = req.body;
  db.query("INSERT INTO facturas (fecha, montoTotal) VALUES (?, ?)", [fecha, montoTotal], (err) => {
    if (err) return res.status(500).json({ error: "Error al crear factura" });
    res.json({ message: "Factura creada" });
  });
});

app.post("/obtenerUltimo", (req, res) => {
  db.query("SELECT idFactura FROM facturas ORDER BY idFactura DESC LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.post("/generarFacturaDetallada", (req, res) => {
  const { idProducto, monto, cantidad, fkFactura, fkUsuario } = req.body;
  const query = "INSERT INTO facturasdetalladas (idProducto, monto, cantidad, fkFactura, fkUsuario) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [idProducto, monto, cantidad, fkFactura, fkUsuario], (err) => {
    if (err) return res.status(500).json({ error: "Error al guardar detalle" });
    res.json({ message: "Detalle agregado" });
  });
});

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
  db.query("SELECT * FROM facturas", (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.get("/mayorProductoVendido", (_, res) => {
  const query = `
    SELECT p.nombre, SUM(fd.cantidad) AS totalVendido
    FROM facturasdetalladas fd
    JOIN productos p ON fd.idProducto = p.idProducto
    GROUP BY fd.idProducto
    ORDER BY totalVendido DESC LIMIT 5`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.get("/ventasMensuales", (_, res) => {
  const query = `
    SELECT DATE_FORMAT(fecha, '%Y-%m') AS fecha, SUM(montoTotal) AS total
    FROM facturas
    GROUP BY fecha`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.get("/ventasSemanales", (_, res) => {
  const query = `
    SELECT SUM(montoTotal) AS total
    FROM facturas
    WHERE fecha >= CURDATE() - INTERVAL 7 DAY`;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Error" });
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});


