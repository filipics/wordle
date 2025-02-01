let wordLength = 5;
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";

// 📌 Obtener palabra desde el backend en Railway con la longitud correcta
async function fetchWord() {
    try {
        const response = await fetch("https://cheerful-joy-production.up.railway.app/api/generate-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ length: wordLength }) // 📌 Ahora enviamos la longitud correcta
        });

        const data = await response.json();
        targetWord = data.word.toLowerCase();

        console.log(`🎯 Nueva palabra de ${wordLength} letras: ${targetWord}`);

        // 📌 Forzar el reinicio de las celdas para evitar problemas de input
        resetGridCells();

    } catch (error) {
        console.error("Error obteniendo la palabra del servidor:", error);
        targetWord = "perro"; // Palabra de respaldo en caso de error
    }
}

// 📌 Cambiar la cantidad de letras y reiniciar el juego correctamente
function setWordLength() {
    const newLength = parseInt(document.getElementById("word-length").value);
    if (!isNaN(newLength) && newLength >= 3 && newLength <= 10) {
        wordLength = newLength;
        resetGame();
    } else {
        showMessage("⚠️ Selecciona un número entre 3 y 10.");
    }
}

// 📌 Reiniciar el juego correctamente
function resetGame() {
    currentRow = 0;
    currentCol = 0;
    document.getElementById("grid").innerHTML = "";
    document.getElementById("keyboard").innerHTML = "";
    document.getElementById("message").textContent = "";
    document.getElementById("reveal-word").textContent = "";
    generateGrid();
    generateKeyboard();
    fetchWord(); // 📌 Se obtiene una nueva palabra con la longitud seleccionada
}

// 📌 Resetear las celdas de input
function resetGridCells() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => cell.textContent = "");
}

// 📌 Generar el tablero de juego con celdas interactivas
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
            key.dataset.status = "default";
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

    const isValid = await validateWord(inputWord);

    if (!isValid) {
        showMessage("❌ Esa palabra no está en la DRAE.");
        return;
    }

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
