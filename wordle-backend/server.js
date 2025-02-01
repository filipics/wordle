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


// 📌 Validar palabra con ChatGPT preguntando si está en la RAE
async function validateWordChatGPT(word) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Eres un experto en el diccionario de la Real Academia Española (RAE). Responde únicamente con 'Sí' o 'No'." },
                    { role: "user", content: `¿La palabra "${word}" está en el diccionario de la RAE? Responde solo con 'Sí' o 'No'.` }
                ],
                max_tokens: 10,
                temperature: 0
            },
            {
                headers: {
                    "Authorization": `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const responseText = response.data.choices[0].message.content.trim();
        console.log(`📌 ChatGPT respondió: ${responseText}`);
        return responseText.toLowerCase() === "sí"; // 📌 Convertimos la respuesta en booleano

    } catch (error) {
        console.error("❌ Error consultando ChatGPT:", error.message);
        return false; // ❌ Si falla, asumimos que la palabra no es válida
    }
}

// 📌 Nueva ruta para validar la palabra con ChatGPT
app.post("/api/validate-word", async (req, res) => {
    const { word } = req.body;

    if (!word || word.length < 3) {
        return res.status(400).json({ valid: false, error: "Palabra inválida" });
    }

    const isValid = await validateWordChatGPT(word);

    if (isValid) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false, error: "La palabra no está en la RAE" });
    }
});

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
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Eres un experto en el diccionario de la Real Academia Española (RAE)." },
                    { role: "user", content: `Responde este mensaje solo con una palabra en español de ${length} letras, sin caracteres especiales ni tildes. Solo esa palabra y ninguna otra palabra mas.` }
                ],
                max_tokens: 30,
                temperature: 0.3
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
