// ================= CONFIGURATION =================
// Collez votre clé Google (commence par AIza...) ici
const GOOGLE_API_KEY = "AIzaSyDFn8lBbp0bIjQhKq_7jXqumnQ3L2_UXvA"; 
// =================================================

// Historique pour Gemini (Le format est différent de ChatGPT)
let conversationHistory = [
    // Gemini n'utilise pas "system", on intègre les règles dans l'interface interne ou le premier message
];

// Instructions système (la personnalité de l'IA)
const SYSTEM_PROMPT = "Tu es ChaCha GPT, une IA intelligente, cool et conviviale. Tu réponds de manière précise et utile.";

const inputField = document.getElementById("user-input");
const chatContainer = document.getElementById("chat-container");
const sendButton = document.getElementById("send-btn");

// Gérer l'entrée (Enter pour envoyer)
inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

async function sendMessage() {
    const userText = inputField.value.trim();
    if (!userText) return;

    // Interface UI : Nettoyage et verrouillage
    inputField.value = "";
    inputField.style.height = 'auto';
    inputField.disabled = true;
    sendButton.disabled = true;

    // 1. Afficher le message de l'utilisateur
    addMessageToUI("user", userText);
    
    // 2. Préparer l'historique pour l'envoi
    conversationHistory.push({
        role: "user",
        parts: [{ text: userText }]
    });

    // 3. Indicateur de chargement
    const loadingId = "loading-" + Date.now();
    addLoadingSpinner(loadingId);

    try {
        // --- C'est ici que ça change pour Google Gemini ---
        // Utilisation du modèle 'gemini-1.5-flash' (rapide et gratuit)
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GOOGLE_API_KEY}`;
        
        // On construit le "contenu" en ajoutant le system prompt discrètement
        // Pour une version simple, on envoie l'historique conversationHistory
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: conversationHistory,
                // On peut ajouter une instruction système "virtual" pour configurer l'IA
                systemInstruction: {
                    parts: [{ text: SYSTEM_PROMPT }]
                }
            })
        });

        const data = await response.json();

        // Suppression du chargement
        const loader = document.getElementById(loadingId);
        if(loader) loader.remove();

        if (data.error) {
            console.error("Erreur Gemini:", data.error);
            addMessageToUI("bot", "🔴 Erreur Google : " + data.error.message);
        } else {
            // Extraction de la réponse chez Gemini
            // La structure est : candidates[0].content.parts[0].text
            const aiText = data.candidates[0].content.parts[0].text;

            addMessageToUI("bot", aiText);
            
            // Ajouter la réponse à l'historique
            conversationHistory.push({
                role: "model", // Gemini utilise "model", pas "assistant"
                parts: [{ text: aiText }]
            });
        }

    } catch (error) {
        console.error("ERREUR:", error);
        const loader = document.getElementById(loadingId);
        if(loader) loader.remove();
        addMessageToUI("bot", "🔴 Erreur de connexion au serveur Google.");
    }

    // Réactiver l'interface
    inputField.disabled = false;
    sendButton.disabled = false;
    inputField.focus();
}

function addMessageToUI(role, text) {
    const messageDiv = document.createElement("div");
    // Conversion des rôles pour le CSS: model -> bot, user -> user
    const cssRole = role === "model" ? "bot" : (role === "bot" ? "bot" : "user");
    
    messageDiv.classList.add("message", cssRole);
    const iconHtml = cssRole === "user" ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    let contentHtml = text;
    // Markdown
    if (cssRole === "bot" && typeof marked !== 'undefined') {
        contentHtml = marked.parse(text);
    } else {
        contentHtml = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }

    messageDiv.innerHTML = `
        <div class="avatar">${iconHtml}</div>
        <div class="content">${contentHtml}</div>
    `;

    chatContainer.appendChild(messageDiv);
    
    // Highlight du code
    if (cssRole === "bot" && typeof hljs !== 'undefined') {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }
    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function addLoadingSpinner(id) {
    const loaderDiv = document.createElement("div");
    loaderDiv.classList.add("message", "bot");
    loaderDiv.id = id;
    loaderDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="content typing-indicator"><span></span><span></span><span></span></div>
    `;
    chatContainer.appendChild(loaderDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}
