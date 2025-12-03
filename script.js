// ================= CONFIGURATION =================
const API_KEY = "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"; // ⚠️ REMPLACEZ CECI PAR VOTRE CLÉ OPENAI
// =================================================

let conversationHistory = [
    { 
        role: "system", 
        content: "Tu es ChaCha GPT, un assistant IA utile, expert en programmation et en rédaction. Tu es précis et poli." 
    }
];

const inputField = document.getElementById("user-input");
const chatContainer = document.getElementById("chat-container");
const sendButton = document.getElementById("send-btn");

// Gestion de la hauteur auto du textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// Envoyer avec Enter (sauf si Shift+Enter)
inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const userText = inputField.value.trim();
    if (!userText) return;

    // UI : Désactiver l'entrée
    inputField.value = "";
    inputField.style.height = 'auto';
    inputField.disabled = true;
    sendButton.disabled = true;

    // 1. Ajouter le message USER à l'écran
    addMessageToUI("user", userText);
    
    // 2. Ajouter à l'historique IA
    conversationHistory.push({ role: "user", content: userText });

    // 3. Ajouter l'indicateur de chargement
    const loadingId = "loading-" + Date.now();
    addLoadingSpinner(loadingId);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo", // ou "gpt-4" si vous y avez accès
                messages: conversationHistory,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Retirer le loading
        document.getElementById(loadingId).remove();

        if (data.error) {
            addMessageToUI("bot", "🔴 Erreur API : " + data.error.message);
        } else {
            const aiText = data.choices[0].message.content;
            
            // 4. Ajouter le message IA à l'écran
            addMessageToUI("bot", aiText);
            
            // 5. Sauvegarder dans l'historique pour le contexte
            conversationHistory.push({ role: "assistant", content: aiText });
        }

    } catch (error) {
        document.getElementById(loadingId)?.remove();
        addMessageToUI("bot", "🔴 Erreur de connexion.");
        console.error(error);
    }

    // Réactiver l'entrée
    inputField.disabled = false;
    sendButton.disabled = false;
    inputField.focus();
}

function addMessageToUI(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", role);

    const iconHtml = role === "user" 
        ? '<i class="fa-solid fa-user"></i>' 
        : '<i class="fa-solid fa-robot"></i>';

    // Utilisation de Marked.js pour transformer le **Gras** et les ```Codes``` en HTML
    // Note : On ne parse pas le markdown de l'utilisateur pour éviter les injections, juste le Bot.
    let contentHtml = text;
    if (role === "bot") {
        contentHtml = marked.parse(text); 
    } else {
        // Sécuriser le texte utilisateur
        contentHtml = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }

    messageDiv.innerHTML = `
        <div class="avatar">${iconHtml}</div>
        <div class="content">${contentHtml}</div>
    `;

    chatContainer.appendChild(messageDiv);
    
    // Si c'est un bot, appliquer la coloration syntaxique au code généré
    if (role === "bot") {
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    scrollToBottom();
}

function addLoadingSpinner(id) {
    const loaderDiv = document.createElement("div");
    loaderDiv.classList.add("message", "bot");
    loaderDiv.id = id;
    loaderDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="content typing-indicator">
            <span></span><span></span><span></span>
        </div>
    `;
    chatContainer.appendChild(loaderDiv);
    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}