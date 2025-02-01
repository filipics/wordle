const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// 📌 Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 📌 Ruta para obtener una palabra
app.post("/api/generate-word", async (req, res) => {
    const { length } = req.body;

    if (!length || isNaN(length) || length < 3 || length > 10) {
        return res.status(400).json({ error: "Longitud inválida. Debe estar entre 3 y 10 letras." });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres un generador de palabras en español." },
                    { role: "user", content: `Genera una palabra en español con exactamente ${length} letras, sin caracteres especiales ni acentos.` }
                ],
                max_tokens: 10,
                temperature: 0.7
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const word = response.data.choices[0].message.content.trim().toLowerCase();
        res.json({ word });
    } catch (error) {
        console.error("Error llamando a OpenAI:", error);
        res.status(500).json({ error: "Error generando la palabra." });
    }
});

// 📌 Ruta para servir el archivo index.html cuando alguien accede a "/"
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Evitar que el proceso termine
process.on("SIGTERM", () => {
    console.log("🚨 Servidor detenido por Railway.");
    process.exit(0);
});
