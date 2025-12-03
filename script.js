// ==================== CONFIGURATION PRO ====================
// OBTENEZ VOTRE CLÉ GRATUITE ICI : https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyC9U0mmD6W9XH01oIGXC8DTCC5ip2IlZTo"; 
// ===========================================================

// --- Variables Système ---
const chatContainer = document.getElementById("chat-container");
const inputField = document.getElementById("user-input");
const sendButton = document.getElementById("send-btn");

// Historique de session (Le cerveau mémoire)
let chatHistory = [];

const SYSTEM_INSTRUCTION = "Tu es ChaCha AI Pro. Tu es un expert en code, concis, professionnel et serviable. Tu utilises Markdown pour le formatage.";

// --- Fonctions d'interface ---

// Agrandissement auto du texte
function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// Envoyer avec Enter
inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// --- COEUR DE L'IA (Moteur Gemini) ---

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // UI Updates
    inputField.value = "";
    inputField.style.height = 'auto';
    setLoadingState(true);

    // 1. Affiche User Message
    addMessageToUI(text, 'user');

    // 2. Prepare Data
    chatHistory.push({ role: "user", parts: [{ text: text }] });

    // 3. Affiche Loading Animation
    const loadingId = createLoadingBubble();

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: chatHistory,
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] } // Instruction Système
            })
        });

        const data = await response.json();

        // Remove loading
        document.getElementById(loadingId)?.remove();

        if (data.error) {
            addMessageToUI("⚠️ Erreur : " + data.error.message, 'ai', true);
        } else {
            const aiResponse = data.candidates[0].content.parts[0].text;
            addMessageToUI(aiResponse, 'ai');
            
            // Mise à jour mémoire
            chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });
        }

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        addMessageToUI("❌ Erreur réseau. Vérifiez votre connexion.", 'ai', true);
        console.error(error);
    }

    setLoadingState(false);
}

// --- Fonctions d'affichage PRO (Markdown & Code) ---

function addMessageToUI(text, type, isError = false) {
    const div = document.createElement("div");
    div.className = `message ${type}`;
    
    // Si c'est l'IA, on convertit le Markdown en HTML joli
    let content = text;
    if (type === 'ai' && !isError) {
        // Parse Markdown
        content = marked.parse(text);
    } else {
        // Sécurité pour l'utilisateur
        content = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }

    div.innerHTML = `
        <div class="bubble" ${isError ? 'style="background:#3f1414;color:#ff8d8d"' : ''}>
            ${content}
        </div>
    `;

    chatContainer.appendChild(div);

    // Après ajout, si c'est de l'IA, on applique le highlight sur le code
    if (type === 'ai') {
        processCodeBlocks(div);
    }

    scrollToBottom();
}

// Fonction Pro pour embellir les blocs de code avec bouton copie
function processCodeBlocks(element) {
    // 1. Coloration syntaxique
    element.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });

    // 2. Ajouter le header "Code" avec bouton copie
    element.querySelectorAll('pre').forEach((pre) => {
        // Crée le header
        const header = document.createElement('div');
        header.className = 'code-header';
        header.innerHTML = `
            <span>Code</span>
            <button class="copy-btn" onclick="copyCode(this)"><i class="ph ph-copy"></i> Copier</button>
        `;
        // Insère avant le <code> mais dans le <pre>
        pre.insertBefore(header, pre.firstChild);
    });
}

function copyCode(btn) {
    const codeBlock = btn.parentElement.nextElementSibling; // Le <code> tag
    const codeText = codeBlock.innerText;
    
    navigator.clipboard.writeText(codeText).then(() => {
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `<i class="ph-fill ph-check"></i> Copié !`;
        setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
    });
}

function createLoadingBubble() {
    const id = "loader-" + Date.now();
    const div = document.createElement("div");
    div.className = "message ai";
    div.id = id;
    div.innerHTML = `
        <div class="bubble">
            <div class="typing"><span></span><span></span><span></span></div>
        </div>
    `;
    chatContainer.appendChild(div);
    scrollToBottom();
    return id;
}

function setLoadingState(isLoading) {
    sendButton.disabled = isLoading;
    inputField.disabled = isLoading;
    if (!isLoading) inputField.focus();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
