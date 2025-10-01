'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  buttons?: Array<{
    text: string;
    action: string;
  }>;
}

export default function DemonstracaoPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<'webchat' | 'whatsapp' | 'facebook' | 'instagram'>('whatsapp');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Inicializar conversa
  useEffect(() => {
    // Limpar mensagens ao trocar de canal
    setMessages([]);
    setConversationId('');
    initializeConversation();
  }, [selectedChannel]); // Re-inicializar quando o canal mudar

  const initializeConversation = async () => {
    try {
      // Simular início de conversa com o bot
      const response = await fetch('https://3000-ibpo3howxfmwxhvuhwe06-e61bfc4f.manusvm.computer/api/public/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_phone: '+5511999999999',
          customer_name: 'Cliente Demonstração',
          channel: selectedChannel.toUpperCase()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setConversationId(data.conversation.id);
        
        // Adicionar mensagem de boas-vindas
        if (data.botResponse) {
          addBotMessage(data.botResponse.content, data.botResponse.buttons);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar conversa:', error);
      // Fallback - adicionar mensagem de boas-vindas padrão
      addBotMessage('Olá! 👋 Bem-vindo ao atendimento da Empresa Demonstração. Como posso ajudá-lo hoje?');
    }
  };

  const addBotMessage = (content: string, buttons?: Array<{text: string; action: string}>) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'bot',
      timestamp: new Date(),
      buttons
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addUserMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if (!content) return;

    // Adicionar mensagem do usuário
    addUserMessage(content);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Enviar mensagem para o bot
      const response = await fetch(`https://3000-ibpo3howxfmwxhvuhwe06-e61bfc4f.manusvm.computer/api/public/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          sender_type: 'CUSTOMER'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Simular delay de digitação
        setTimeout(() => {
          setIsTyping(false);
          if (data.botResponse) {
            addBotMessage(data.botResponse.content, data.botResponse.buttons);
          }
        }, 1500);
      } else {
        setIsTyping(false);
        addBotMessage('Desculpe, ocorreu um erro. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
      addBotMessage('Desculpe, ocorreu um erro de conexão. Tente novamente.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Efeito para forçar re-renderização quando o canal muda
  useEffect(() => {
    // Forçar re-renderização quando o canal muda
    console.log(`Canal alterado para: ${selectedChannel}`);
    // Nada mais é necessário aqui, apenas a dependência em selectedChannel
    // fará o componente re-renderizar
  }, [selectedChannel]);

  // Função para obter configurações visuais do canal
  const getChannelTheme = () => {
    switch (selectedChannel) {
      case 'whatsapp':
        return {
          headerBg: 'bg-green-600',
          headerText: 'text-white',
          headerAccent: 'text-green-100',
          companyName: 'Empresa Demonstração',
          companyInitials: 'ED',
          userBubble: 'bg-green-500 text-white',
          botBubble: 'bg-white text-gray-800 shadow-sm'
        };
      case 'facebook':
        return {
          headerBg: 'bg-blue-600',
          headerText: 'text-white',
          headerAccent: 'text-blue-100',
          companyName: 'Empresa Demonstração',
          companyInitials: 'ED',
          userBubble: 'bg-blue-500 text-white',
          botBubble: 'bg-white text-gray-800 shadow-sm'
        };
      case 'instagram':
        return {
          headerBg: 'bg-gradient-to-r from-purple-500 to-pink-500',
          headerText: 'text-white',
          headerAccent: 'text-purple-100',
          companyName: 'Empresa Demonstração',
          companyInitials: 'ED',
          userBubble: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
          botBubble: 'bg-white text-gray-800 shadow-sm'
        };
      case 'webchat':
        return {
          headerBg: 'bg-indigo-600',
          headerText: 'text-white',
          headerAccent: 'text-indigo-100',
          companyName: 'Atendimento Online',
          companyInitials: 'AO',
          userBubble: 'bg-indigo-500 text-white',
          botBubble: 'bg-white text-gray-800 shadow-sm'
        };
      default:
        return {
          headerBg: 'bg-green-600',
          headerText: 'text-white',
          headerAccent: 'text-green-100',
          companyName: 'Empresa Demonstração',
          companyInitials: 'ED',
          userBubble: 'bg-green-500 text-white',
          botBubble: 'bg-white text-gray-800 shadow-sm'
        };
    }
  };

  // Obter tema atual baseado no canal selecionado
  // Movido para dentro do componente para garantir que seja recalculado a cada renderização
  const theme = getChannelTheme();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Container do Smartphone */}
      <div className="w-full max-w-sm mx-auto">
        
        {/* Seletor de Canal Omnichannel */}
        <div className="mb-4 bg-white rounded-lg shadow-md p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Simular Canal de Atendimento
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value as any)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="webchat">Simular: Webchat</option>
            <option value="whatsapp">Simular: WhatsApp</option>
            <option value="facebook">Simular: Facebook Messenger</option>
            <option value="instagram">Simular: Instagram</option>
          </select>
        </div>

        {/* Moldura do Smartphone */}
        <div className="bg-black rounded-3xl p-2 shadow-2xl">
          <div className="bg-white rounded-2xl overflow-hidden h-[700px] flex flex-col">
            
            {/* Header Dinâmico baseado no Canal */}
            <div className={`${theme.headerBg} ${theme.headerText} p-4 flex items-center space-x-3`}>
              <ArrowLeft className="h-6 w-6" />
              <div className="flex-1 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className={`${selectedChannel === 'whatsapp' ? 'text-green-600' : selectedChannel === 'facebook' ? 'text-blue-600' : selectedChannel === 'instagram' ? 'text-purple-600' : 'text-indigo-600'} font-bold text-sm`}>
                    {theme.companyInitials}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{theme.companyName}</h3>
                  <p className={`text-xs ${theme.headerAccent}`}>Online</p>
                </div>
              </div>
              <div className="flex space-x-4">
                <Video className="h-5 w-5" />
                <Phone className="h-5 w-5" />
                <MoreVertical className="h-5 w-5" />
              </div>
            </div>

            {/* Área de Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user' 
                      ? theme.userBubble
                      : theme.botBubble
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Botões do Bot */}
                    {message.buttons && message.buttons.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={() => sendMessage(button.text)}
                            className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            {button.text}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Indicador de digitação */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 shadow-sm px-4 py-2 rounded-lg max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input de Mensagem */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite uma mensagem..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações da Demo */}
        <div className="mt-6 text-center text-gray-600">
          <h2 className="text-lg font-semibold mb-2">🎭 Modo Demonstração</h2>
          <p className="text-sm">
            Esta é uma simulação do WhatsApp para demonstrar o chatbot.
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Experimente digitar: "111.111.111-11" ou "222.222.222-22"
          </p>
        </div>
      </div>
    </div>
  );
}

