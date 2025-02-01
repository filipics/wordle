let wordLength = 5;
let targetWord = "";
let currentRow = 0;
let currentCol = 0;
const maxAttempts = 6;
const allowedLetters = "qwertyuiopasdfghjklñzxcvbnm";
const diacritics = /[áéíóúü]/;
const usedWords = new Set(); // Keep track of words used in a session

async function fetchWord() {
    try {
        const response = await fetch("http://localhost:3000/api/generate-word", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ length: wordLength }) // Enviar la longitud de la palabra
        });

        const data = await response.json();
        targetWord = data.word.toLowerCase(); // Guardar la palabra generada
        console.log(`Palabra seleccionada: ${targetWord}`);
    } catch (error) {
        console.error("Error obteniendo la palabra del servidor:", error);
        targetWord = "perro"; // Palabra de respaldo en caso de error
    }
}


function setWordLength() {
    wordLength = parseInt(document.getElementById("word-length").value);
    resetGame();
}

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

function generateGrid() {
    const grid = document.getElementById("grid");
    grid.style.gridTemplateColumns = `repeat(${wordLength}, 60px)`;
    grid.innerHTML = "";
    for (let i = 0; i < maxAttempts * wordLength; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i;
        grid.appendChild(cell);
    }
    updateSelectedCell();
}

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

function resetKeyboardStyles() {
    document.querySelectorAll(".key").forEach(key => {
        key.classList.remove("correct", "present", "absent");
    });
}

function updateSelectedCell() {
    document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("selected"));
    if (currentCol < wordLength) {
        const index = currentRow * wordLength + currentCol;
        document.querySelectorAll(".cell")[index].classList.add("selected");
    }
}

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
        const index = currentRow * wordLength + currentCol;
        document.querySelectorAll(".cell")[index].textContent = "";
        updateSelectedCell();
        return;
    }
    if (!allowedLetters.includes(key) || currentCol >= wordLength) return;

    const index = currentRow * wordLength + currentCol;
    document.querySelectorAll(".cell")[index].textContent = key.toUpperCase();
    currentCol++;
    updateSelectedCell();
}

function checkWord() {
    console.log("checkWord() ejecutado");
    let inputWord = "";
    let gridCells = document.querySelectorAll(".cell");
    let letterCount = {}; // Para rastrear la cantidad de letras en la palabra objetivo

    for (let i = 0; i < wordLength; i++) {
        inputWord += gridCells[currentRow * wordLength + i].textContent.toLowerCase();
        letterCount[targetWord[i]] = (letterCount[targetWord[i]] || 0) + 1;
    }
    console.log("Palabra ingresada:", inputWord);
    
    // Primera pasada: marcar letras correctas (verde)
    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (letter === targetWord[i]) {
            cell.classList.add("correct");
            key.classList.remove("present", "absent"); // Quitar otros colores si estaban antes
            key.classList.add("correct"); // Marcar verde en el teclado
            letterCount[letter]--; // Reducir el contador de letras disponibles
        }
    }
    
    // Segunda pasada: marcar letras presentes (amarillo) o ausentes (gris)
    for (let i = 0; i < wordLength; i++) {
        let cell = gridCells[currentRow * wordLength + i];
        let letter = inputWord[i];
        let key = document.getElementById(`key-${letter}`);

        if (!cell.classList.contains("correct")) { // Si no es verde
            if (targetWord.includes(letter) && letterCount[letter] > 0) {
                cell.classList.add("present");
                if (!key.classList.contains("correct")) { // Solo actualizar si no es verde
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
    }

    // Verificar si el usuario ganó
    if (inputWord === targetWord) {
        document.getElementById("message").textContent = "🎉 ¡Ganaste!";
    } else if (currentRow === maxAttempts - 1) {
        document.getElementById("reveal-word").textContent = `La palabra era: ${targetWord.toUpperCase()}`;
    }
    
    currentRow++;
    currentCol = 0;
    updateSelectedCell();
}


function showMessage(text) {
    const messageElement = document.getElementById("message");
    messageElement.textContent = text;
    messageElement.style.opacity = "1";
    setTimeout(() => {
        messageElement.style.opacity = "0";
    }, 2000);
}

// Initial setup
fetchWord();
generateGrid();
generateKeyboard();
