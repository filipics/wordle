const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// 📌 Servir archivos estáticos desde "public"
app.use(express.static(path.join(__dirname, "public")));

// 📌 Ruta para devolver index.html en cualquier URL desconocida
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});

// Evitar que el proceso termine
process.on("SIGTERM", () => {
    console.log("🚨 Servidor detenido por Railway.");
    process.exit(0);
});
