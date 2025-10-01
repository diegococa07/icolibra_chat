
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, WifiOff, Wifi } from 'lucide-react';
import { conversationsAPI, WebchatMessage, BotResponse } from '@/lib/api';

interface WebchatWidgetProps {
  snippetId: string;
  apiUrl: string;
}

const WebchatWidget: React.FC<WebchatWidgetProps> = ({ snippetId, apiUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<WebchatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [currentButtons, setCurrentButtons] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set API URL dynamically
  useEffect(() => {
    conversationsAPI.setBaseUrl(apiUrl);
  }, [apiUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startNewConversation = async () => {
    setIsLoading(true);
    try {
      const response = await conversationsAPI.startConversation();
      setConversationId(response.conversation.id);
      setMessages([
        {
          id: `bot-${Date.now()}`,
          type: 'bot',
          content: response.bot_response.content,
          timestamp: new Date().toISOString(),
          buttons: response.bot_response.buttons,
        },
      ]);
      setCurrentButtons(response.bot_response.buttons || []);
      setAwaitingInput(response.bot_response.requires_input || false);
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([
        {
          id: `error-${Date.now()}`,
          type: 'bot',
          content: 'Desculpe, não foi possível iniciar a conversa. Tente novamente mais tarde.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string, messageType: 'TEXT' | 'BUTTON', buttonIndex?: number) => {
    if (!content.trim() || !conversationId) return;

    const userMessage: WebchatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setCurrentButtons([]); // Clear buttons after user interaction
    setAwaitingInput(false);
    setIsLoading(true);

    try {
      const response = await conversationsAPI.sendMessage(conversationId, {
        content,
        message_type: messageType,
        button_index: buttonIndex,
      });

      const botResponse: BotResponse = response.bot_response;

      const newBotMessage: WebchatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: botResponse.content,
        timestamp: new Date().toISOString(),
        buttons: botResponse.buttons,
      };
      setMessages((prev) => [...prev, newBotMessage]);
      setCurrentButtons(botResponse.buttons || []);
      setAwaitingInput(botResponse.requires_input || false);

      if (botResponse.type === 'transfer') {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-transfer-${Date.now()}`,
            type: 'bot',
            content: 'Um atendente foi notificado e assumirá esta conversa em breve.',
            timestamp: new Date().toISOString(),
          },
        ]);
        // Optionally disable input after transfer
        setAwaitingInput(false);
        setCurrentButtons([]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'bot',
          content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      handleSendMessage(inputMessage, 'TEXT');
    }
  };

  const handleButtonClick = (buttonText: string, index: number) => {
    handleSendMessage(buttonText, 'BUTTON', index);
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !conversationId) {
      startNewConversation();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <MessageSquare size={28} />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-xl flex flex-col w-80 h-96 max-h-[80vh] overflow-hidden border border-gray-200 animate-fade-in-up">
          {/* Chat Header */}
          <div className="bg-indigo-600 text-white p-3 flex items-center justify-between shadow-md flex-shrink-0">
            <h3 className="font-semibold text-lg">Atendimento Omnichannel</h3>
            <button
              onClick={toggleChat}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] p-2 rounded-lg shadow-sm ${msg.type === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 rounded-bl-none'}
                  `}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.buttons && msg.buttons.length > 0 && msg.type === 'bot' && (
                    <div className="mt-2 flex flex-col space-y-1">
                      {msg.buttons.map((buttonText, index) => (
                        <button
                          key={index}
                          onClick={() => handleButtonClick(buttonText, index)}
                          className="bg-indigo-100 text-indigo-700 text-xs py-1 px-2 rounded-md hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          disabled={isLoading}
                        >
                          {buttonText}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="block text-right text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="max-w-[75%] p-2 rounded-lg shadow-sm bg-gray-200 text-gray-800 rounded-bl-none flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Digitando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            {currentButtons.length > 0 && !awaitingInput ? (
              <div className="flex flex-wrap gap-2 mb-2">
                {currentButtons.map((buttonText, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(buttonText, index)}
                    className="bg-indigo-100 text-indigo-700 text-sm py-1 px-2 rounded-md hover:bg-indigo-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    disabled={isLoading}
                  >
                    {buttonText}
                  </button>
                ))}
              </div>
            ) : null}

            {(awaitingInput || currentButtons.length === 0) && (
              <form onSubmit={handleInputSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={awaitingInput ? 'Digite sua resposta...' : 'Digite uma mensagem...'}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <Send size={20} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebchatWidget;


