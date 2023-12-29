const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatBox = document.querySelector(".chatbox");

let userMessage;

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", className);
    let chatContent = className === "outgoing" ? `<p>${message}</p>` : `<span class="material-icons">smart_toy</span><p>${message}</p>`
    chatLi.innerHTML = chatContent;
    return chatLi;
}

const generateResponse = async (incomingChatLi) => {

    const messageElement = incomingChatLi.querySelector("p");
    const formData = new FormData();
    formData.append('prompt', userMessage);
    formData.append('csrfmiddlewaretoken', csrfToken);

    try {
        const response = await fetch('/gemini', {
            method: 'POST',
            body: formData
        });
        const generated = await response.json();
        messageElement.textContent = generated['answer'];
        console.log("Testing", generated);

    } catch (error) {
        messageElement.textContent = "Oops! Something went wrong";
    }
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;

    chatBox.appendChild(createChatLi(userMessage, "outgoing"));

    setTimeout(() => {
        const incomingChatLi = createChatLi("Loading...", "incoming")
        chatBox.appendChild(incomingChatLi);
        generateResponse(incomingChatLi);
    }, 600);
}

const handleVoice = (transcription) => {
    userMessage = transcription.trim();
    if(!userMessage) return;

    chatBox.appendChild(createChatLi(userMessage, "outgoing"));

    setTimeout(() => {
        const incomingChatLi = createChatLi("Loading...", "incoming")
        chatBox.appendChild(incomingChatLi);
        generateResponse(incomingChatLi);
    }, 600);
}

sendChatBtn.addEventListener("click", handleChat);

