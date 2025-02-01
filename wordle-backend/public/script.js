let wordLength = 5;
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";

// 📌 Obtener palabra desde el backend en Railway
async function fetchWord() {
    try {
        const response = await fetch("https://cheerful-joy-production.up.railway.app/api/generate-word", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ length: wordLength })
        });

        const data = await response.json();
        targetWord = data.word.toLowerCase();
        console.log(`🎯 Nueva palabra: ${targetWord}`);

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
        resetGame(); // 📌 Ahora sí reinicia el juego y genera las celdas
    } else {
        showMessage("⚠️ Selecciona un número entre 3 y 10.");
    }
}

async function resetGame() {
    currentRow = 0;
    currentCol = 0;
    document.getElementById("grid").innerHTML = "";
    document.getElementById("keyboard").innerHTML = "";
    document.getElementById("message").textContent = "";
    document.getElementById("reveal-word").textContent = "";

    generateGrid();
    generateKeyboard();

    await fetchWord(); // 📌 Esperar a que se obtenga la nueva palabra antes de permitir la escritura
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
            key.dataset.status = "default"; // 📌 Nuevo atributo para manejar estados
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

// 📌 Resetear colores del teclado
function resetKeyboardStyles() {
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove("correct", "present", "absent");
        key.dataset.status = "default";
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

// 📌 Procesar la palabra correctamente
function processWord(inputWord) {
    let gridCells = document.querySelectorAll(".cell");
    let letterCount = {};

    for (let i = 0; i < wordLength; i++) {
        letterCount[targetWord[i]] = (letterCount[targetWord[i]] || 0) + 1;
    }

    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (letter === targetWord[i]) {
            cell.classList.add("correct");
            key.classList.remove("present", "absent");
            key.classList.add("correct");
            letterCount[letter]--;
        } else if (targetWord.includes(letter) && letterCount[letter] > 0) {
            cell.classList.add("present");
            if (!key.classList.contains("correct")) {
                key.classList.remove("absent");
                key.classList.add("present");
            }
            letterCount[letter]--;
        } else {
            if (!key.classList.contains("correct") && !key.classList.contains("present")) {
                cell.classList.add("absent");
                key.classList.add("absent");
            }
        }
    }

    if (inputWord === targetWord) {
        showMessage("🎉 ¡Ganaste!");
    } else if (currentRow === maxAttempts - 1) {
        document.getElementById("reveal-word").textContent = `La palabra era: ${targetWord.toUpperCase()}`;
    }

    currentRow++;
    currentCol = 0;
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
