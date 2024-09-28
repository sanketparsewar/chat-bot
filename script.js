const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;
//Api configuration
const API_KEY = 'AIzaSyBToZpSlJ0XDOdAuGnQxEI1lXzQegGyRTk';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const localStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  // apply the stored Theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Restore savedchats
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats); //hide the header once chat start
  chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
};
localStorageData();

// create new message element and return it ...classes is accepting multiple classes that are passed as argument
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;

  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    //Append eachword to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    //if all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); //saving chats to loaclSTorage
    }
    chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
  }, 75);
};

//fetch response from the api based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); //get the text element
  //send a post request to api with the user's message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    //Get the api response text and remove * from the text content
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);

    // console.log(apiResponse)
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText=error.message;
    textElement.classList.add('error');
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

//show loading animation while waiting for api response
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                <img src="images/gemini.svg" alt="gemini image" class="avatar">
                <p class="text"></p>
                <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                </div>
            </div>
            <span onclick='copyMessage(this)' class="icon material-symbols-outlined">content_copy</span>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
  generateAPIResponse(incomingMessageDiv);
};

//copy message text to clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000); //revert icon after 1 second
};

//handle sendng request outgoing chat messages
const handleOutGoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; //Exit is there is no message
  isResponseGenerating = true;
  const html = `<div class="message-content">
                <img src="images/user.jpg" alt="user image" class="avatar">
                <p class="text"></p>
            </div>`;
  const outGoingMessageDiv = createMessageElement(html, "outgoing");
  outGoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatList.appendChild(outGoingMessageDiv);

  typingForm.reset(); // reset input field
  chatList.scrollTo(0, chatList.scrollHeight); //scroll to bottom
  document.body.classList.add("hide-header"); //hide the header once chat start
  setTimeout(showLoadingAnimation, 500); //show loading animation after a delay
};

//set userMessage and handle outgioing chats when a suggestion is clicked
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutGoingChat();
  });
});

// toggle between light and dark theme
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

//delete all messages from the local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("are you want to delete all messages?")) {
    localStorage.removeItem("savedChats");
    localStorageData();
  }
});

// this will prevent the default behaviour of the form that is submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutGoingChat();
});
