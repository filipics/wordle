let wordLength = 5;  // Longitud por defecto
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
const usedWords = new Set(); // Para evitar palabras repetidas en una sesión

// 📌 Obtener palabra desde el backend en Railway
async function fetchWord() {
    try {
        const response = await fetch("https://cheerful-joy-production.up.railway.app/api/generate-word", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ length: wordLength })
        });

        const data = await response.json();
        targetWord = data.word.toLowerCase();

        // Evitar palabras repetidas
        if (usedWords.has(targetWord)) {
            console.log("Palabra repetida, generando otra...");
            return fetchWord();
        }
        usedWords.add(targetWord);
        console.log(`🎯 Palabra seleccionada: ${targetWord}`);

    } catch (error) {
        console.error("Error obteniendo la palabra del servidor:", error);
        targetWord = "perro"; // Palabra de respaldo en caso de error
    }
}

// 📌 Cambiar la longitud de la palabra según la selección del usuario
function setWordLength() {
    wordLength = parseInt(document.getElementById("word-length").value);
    resetGame();
}

// 📌 Reiniciar el juego
function resetGame() {
    currentRow = 0;
    currentCol = 0;
    document.getElementById("grid").innerHTML = "";
    document.getElementById("message").textContent = "";
    document.getElementById("reveal-word").textContent = "";
    resetKeyboardStyles();
    generateGrid();
    generateKeyboard();
    fetchWord();
}

// 📌 Generar el tablero de juego
function generateGrid() {
    const grid = document.getElementById("grid");
    grid.style.gridTemplateColumns = `repeat(${wordLength}, 60px)`;
    grid.innerHTML = "";
    for (let i = 0; i < maxAttempts * wordLength; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        grid.appendChild(cell);
    }
}

// 📌 Generar el teclado en pantalla
function generateKeyboard() {
    const keyboard = document.getElementById("keyboard");
    keyboard.innerHTML = "";
    const rows = ["qwertyuiop", "asdfghjklñ", "zxcvbnm"];
    rows.forEach(row => {
        const rowDiv = document.createElement("div");
        rowDiv.classList.add("keyboard-row");
        row.split("").forEach(letter => {
            const key = document.createElement("div");
            key.classList.add("key");
            key.textContent = letter;
            key.id = `key-${letter}`;
            key.addEventListener("click", () => handleKeyPress(letter));
            rowDiv.appendChild(key);
        });
        keyboard.appendChild(rowDiv);
    });

    // Añadir teclas de "Enter" y "Backspace"
    const lastRow = document.createElement("div");
    lastRow.classList.add("keyboard-row");

    const enterKey = document.createElement("div");
    enterKey.classList.add("key", "key-enter");
    enterKey.textContent = "Enter";
    enterKey.style.width = "80px";
    enterKey.addEventListener("click", () => handleKeyPress("Enter"));

    const backspaceKey = document.createElement("div");
    backspaceKey.classList.add("key", "key-backspace");
    backspaceKey.textContent = "←";
    backspaceKey.style.width = "50px";
    backspaceKey.addEventListener("click", () => handleKeyPress("Backspace"));

    lastRow.appendChild(backspaceKey);
    lastRow.appendChild(enterKey);
    keyboard.appendChild(lastRow);
}

// 📌 Reiniciar estilos del teclado
function resetKeyboardStyles() {
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove("correct", "present", "absent");
    });
}

// 📌 Manejar entrada del teclado
document.addEventListener("keydown", function(event) {
    handleKeyPress(event.key);
});

function handleKeyPress(key) {
    key = key.toLowerCase();
    if (key === "enter") {
        if (currentCol === wordLength) {
            checkWord();
        } else {
            showMessage("Completa la palabra antes de enviar.");
        }
        return;
    }
    if (key === "backspace" && currentCol > 0) {
        currentCol--;
        const cells = document.querySelectorAll(".cell");
        cells[currentRow * wordLength + currentCol].textContent = "";
        return;
    }
    if (!allowedLetters.includes(key) || currentCol >= wordLength) return;

    const cells = document.querySelectorAll(".cell");
    cells[currentRow * wordLength + currentCol].textContent = key.toUpperCase();
    currentCol++;
}

// 📌 Validar la palabra ingresada antes de continuar
async function checkWord() {
    let inputWord = "";
    let gridCells = document.querySelectorAll(".cell");

    for (let i = 0; i < wordLength; i++) {
        inputWord += gridCells[currentRow * wordLength + i].textContent.toLowerCase();
    }

    // 📌 Validar si la palabra está en la RAE con ChatGPT
    const isValid = await validateWord(inputWord);

    if (!isValid) {
        showMessage("❌ Esa palabra no está en la RAE.");
        return;
    }

    // 📌 Si la palabra es válida, continuar con la lógica del juego
    processWord(inputWord);
}

// 📌 Función para validar la palabra en el backend
async function validateWord(word) {
    try {
        const response = await fetch("https://cheerful-joy-production.up.railway.app/api/validate-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ word })
        });

        const data = await response.json();
        return data.valid;
    } catch (error) {
        console.error("❌ Error validando la palabra:", error);
        return false;
    }
}

// 📌 Mostrar mensajes al usuario
function showMessage(text) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = text;
    setTimeout(() => {
        messageElement.textContent = "";
    }, 2000);
}

// 📌 Inicializar juego
fetchWord();
generateGrid();
generateKeyboard();
