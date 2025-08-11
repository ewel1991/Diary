import React, { useState, useEffect  } from "react";


const API_URL = "http://68.183.215.186:3000";

const Chatbot = ({ noteContent }) => {
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const callGeminiAPI = async (messages) => {
    try {
      const response = await fetch(`${API_URL}/api/gemini`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Błąd Gemini API:", errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.text || "Brak odpowiedzi";
      return aiMessage;
    } catch (error) {
      console.error("Błąd Gemini API:", error);
      return "Ups, coś poszło nie tak z Gemini.";
    }
  };

  const handleSend = async (messageText = "") => {
    const userMessage = messageText?.trim() || input.trim();
    if (!userMessage) return;

    setChat((prev) => [...prev, { role: "user", message: userMessage }]);
    setInput("");
    setLoading(true);

    const messagesForAPI = [
      ...chat.map(msg => ({
        role: msg.role === "ai" ? "assistant" : "user",
        message: msg.message,
      })),
      { role: "user", message: userMessage },
    ];

    const aiReply = await callGeminiAPI(messagesForAPI);
    setChat((prev) => [...prev, { role: "ai", message: aiReply }]);
    setLoading(false);
  };

  useEffect(() => {
    if (noteContent) {
      handleSend(`Na podstawie tej notatki daj mi praktyczną poradę: "${noteContent}"`);
    }
    
  }, [noteContent]);

  return (
    <div className="chatbot-container">
      <div className="chatbot-box">
        <div className="chatbot-messages">
          {chat.map((msg, index) => (
            <p
              key={index}
              className={msg.role === "user" ? "chatbot-message user" : "chatbot-message ai"}
            >
              <strong>{msg.role === "user" ? "Ty" : "Gemini"}:</strong> {msg.message}
            </p>
          ))}
        </div>
        <div className="chatbot-input-row">
          <input
            type="text"
            value={input}
            placeholder="Zadaj pytanie..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="chatbot-input"
            disabled={loading}
          />
          <button onClick={handleSend} className="chatbot-send-button" title="Wyślij">
            <svg xmlns="http://www.w3.org/2000/svg" height="24" width="24" viewBox="0 0 24 24" fill="#0b7dda">
              <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
