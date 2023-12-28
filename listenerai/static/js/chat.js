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

const generateResponse = () => {

    try {
        const response = fetch('/listen', {
            method: 'POST',
            body: formData
        });

        const transcription = response.json();
        console.log('Transcription:', transcription);
    } catch (error) {
        console.error('Error:', error);
    }

}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    chatBox.appendChild(createChatLi(userMessage, "outgoing"));
    setTimeout(() => {
        chatBox.appendChild(createChatLi("Loading...", "incoming"));
    }, 600);
    generateResponse();
}

sendChatBtn.addEventListener("click", handleChat);

