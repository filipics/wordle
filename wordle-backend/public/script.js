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

// 📌 Validar la palabra ingresada
function checkWord() {
    let inputWord = "";
    let gridCells = document.querySelectorAll(".cell");
    let letterCount = {}; // Contador de letras en la palabra objetivo

    // 📌 Crear un conteo de letras en la palabra objetivo
    for (let i = 0; i < wordLength; i++) {
        inputWord += gridCells[currentRow * wordLength + i].textContent.toLowerCase();
        letterCount[targetWord[i]] = (letterCount[targetWord[i]] || 0) + 1;
    }

    // 📌 Primera pasada: marcar letras correctas (verde) y actualizar contador
    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (letter === targetWord[i]) {  // 📌 Coincidencia exacta (verde)
            cell.classList.add("correct");
            key.classList.remove("present", "absent");
            key.classList.add("correct");
            letterCount[letter]--; // Reducimos el conteo porque ya se usó esta letra
        }
    }

    // 📌 Segunda pasada: marcar letras presentes (amarillo) sin afectar los verdes
    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (!cell.classList.contains("correct")) {  // 📌 Solo revisamos letras NO verdes
            if (letterCount[letter] > 0) { // 📌 Si la letra está en la palabra (pero en otra posición)
                cell.classList.add("present");
                if (!key.classList.contains("correct")) { // 📌 No cambiar si ya es verde
                    key.classList.add("present");
                }
                letterCount[letter]--; // Reducimos la cantidad de veces que puede aparecer
            }
        }
    }

    // 📌 Tercera pasada: marcar letras ausentes (gris) correctamente
    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (!cell.classList.contains("correct") && !cell.classList.contains("present")) {  
            // 📌 Solo marcamos en gris si no fue verde ni amarillo
            cell.classList.add("absent");
            if (!key.classList.contains("correct") && !key.classList.contains("present")) { 
                key.classList.add("absent");
            }
        }
    }

    // 📌 Verificar si el usuario ganó
    if (inputWord === targetWord) {
        document.getElementById("message").textContent = "🎉 ¡Ganaste!";
    } else if (currentRow === maxAttempts - 1) {
        document.getElementById("reveal-word").textContent = `La palabra era: ${targetWord.toUpperCase()}`;
    }

    currentRow++;
    currentCol = 0;
}

// 📌 Mostrar mensajes temporales
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
