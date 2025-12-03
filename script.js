// ================= CONFIGURATION =================
// Collez votre clé entre les guillemets.
const API_KEY = "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"; 
// =================================================

// CONFIGURATION IA
let conversationHistory = [
    { 
        role: "system", 
        content: "Tu es ChaCha GPT, une IA super cool et sympa. Tu utilises des émojis et tu es concise." 
    }
];

const inputField = document.getElementById("user-input");
const chatContainer = document.getElementById("chat-container");
const sendButton = document.getElementById("send-btn");

// Cette fonction nettoie votre clé au cas où vous avez mis des espaces
function getCleanKey() {
    return API_KEY.trim(); 
}

// Envoyer avec Enter
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
    const cleanKey = getCleanKey();

    if (!userText) return;

    if (!cleanKey || cleanKey.length < 10 || cleanKey.startsWith("sk-...") ) {
        alert("⚠️ ERREUR : Vous n'avez pas mis votre vraie Clé API dans le fichier script.js !");
        return;
    }

    // UI Updates
    inputField.value = "";
    inputField.style.height = 'auto';
    inputField.disabled = true;
    sendButton.disabled = true;

    addMessageToUI("user", userText);
    conversationHistory.push({ role: "user", content: userText });

    const loadingId = "loading-" + Date.now();
    addLoadingSpinner(loadingId);

    try {
        console.log("Tentative d'envoi à OpenAI...");
        
        // CORRECTION DU PROBLEME FETCH
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            //referrerPolicy: "no-referrer", // Astuce pour éviter certains blocages
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: conversationHistory,
                temperature: 0.8
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Erreur API Details:", errorData);
            
            let msg = "Erreur " + response.status;
            if(response.status === 401) msg = "Erreur de Clé API (Invalide). Vérifiez le code.";
            if(response.status === 429) msg = "Plus de crédits ($) sur votre compte OpenAI.";
            if(response.status === 404) msg = "Erreur 404: Modèle ou lien incorrect.";
            
            throw new Error(msg);
        }

        const data = await response.json();
        
        // Retirer le spinner
        const loader = document.getElementById(loadingId);
        if(loader) loader.remove();

        const aiText = data.choices[0].message.content;
        addMessageToUI("bot", aiText);
        conversationHistory.push({ role: "assistant", content: aiText });

    } catch (error) {
        console.error("ERREUR CRITIQUE:", error);
        const loader = document.getElementById(loadingId);
        if(loader) loader.remove();
        
        // Message d'aide affiché direct dans le chat
        addMessageToUI("bot", "🔴 <b>" + error.message + "</b><br>Si c'est 'TypeError: Failed to fetch', désactivez AdBlock ou changez de réseau (Wifi Pro/Ecole bloque souvent OpenAI).");
    }

    inputField.disabled = false;
    sendButton.disabled = false;
    inputField.focus();
}

function addMessageToUI(role, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", role);
    const iconHtml = role === "user" ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-robot"></i>';

    let contentHtml = text;
    // Si marked (le convertisseur Markdown) est chargé, on l'utilise
    if (role === "bot" && typeof marked !== 'undefined') {
        contentHtml = marked.parse(text);
    } else {
        contentHtml = text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    }

    messageDiv.innerHTML = `
        <div class="avatar">${iconHtml}</div>
        <div class="content">${contentHtml}</div>
    `;

    chatContainer.appendChild(messageDiv);
    
    if (role === "bot" && typeof hljs !== 'undefined') {
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
