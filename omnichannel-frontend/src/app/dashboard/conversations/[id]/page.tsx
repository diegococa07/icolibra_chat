'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Bot, 
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import CustomerContextPanel from '@/components/CustomerContextPanel';
import { conversationsAPI } from '@/lib/api';

interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'BOT' | 'CUSTOMER' | 'AGENT';
  sender_id?: string;
  content: string;
  content_type: string;
  created_at: string;
}

interface Conversation {
  id: string;
  customer_identifier?: string;
  status: 'BOT' | 'QUEUED' | 'OPEN' | 'CLOSED';
  queue?: string;
  assignee_id?: string;
  created_at: string;
}

const ConversationDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversationData();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationData = async () => {
    try {
      setLoading(true);
      const response = await conversationsAPI.getMessages(conversationId);
      setMessages(response.messages || []);
      setConversation(response.conversation);
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      // Simular envio de mensagem do agente
      // Como não temos endpoint específico para agentes, vamos simular
      const agentMessage: Message = {
        id: `agent-${Date.now()}`,
        conversation_id: conversationId,
        sender_type: 'AGENT',
        content: newMessage,
        content_type: 'TEXT',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);
      setNewMessage('');
      
      // Em uma implementação real, você faria uma chamada para a API aqui
      // await conversationsAPI.sendAgentMessage(conversationId, { content: newMessage });
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await conversationsAPI.assignConversation(conversationId);
      loadConversationData();
      alert('Conversa atribuída com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir conversa:', error);
      alert('Erro ao atribuir conversa');
    }
  };

  const handleCloseConversation = async () => {
    const reason = prompt('Motivo do encerramento (opcional):');
    try {
      await conversationsAPI.closeConversation(conversationId, { reason: reason || undefined });
      loadConversationData();
      alert('Conversa encerrada com sucesso!');
    } catch (error) {
      console.error('Erro ao encerrar conversa:', error);
      alert('Erro ao encerrar conversa');
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'BOT':
        return <Bot className="h-4 w-4" />;
      case 'CUSTOMER':
        return <User className="h-4 w-4" />;
      case 'AGENT':
        return <User className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSenderColor = (senderType: string) => {
    switch (senderType) {
      case 'BOT':
        return 'bg-blue-100 text-blue-800';
      case 'CUSTOMER':
        return 'bg-gray-100 text-gray-800';
      case 'AGENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOT':
        return 'bg-blue-100 text-blue-800';
      case 'QUEUED':
        return 'bg-yellow-100 text-yellow-800';
      case 'OPEN':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando conversa...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Conversa não encontrada</p>
          <button
            onClick={() => router.push('/dashboard/conversations')}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Voltar para Conversas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/conversations')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {conversation.customer_identifier || 'Cliente Anônimo'}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                    {conversation.queue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {conversation.queue}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {conversation.status === 'QUEUED' && (
                <button
                  onClick={handleAssignToMe}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Assumir Conversa
                </button>
              )}
              
              {(conversation.status === 'OPEN' || conversation.status === 'BOT') && (
                <button
                  onClick={handleCloseConversation}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Encerrar Conversa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conversation Info */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>Criada em: {new Date(conversation.created_at).toLocaleString('pt-BR')}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>ID: {conversation.id}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma mensagem nesta conversa</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_type === 'CUSTOMER'
                        ? 'bg-indigo-600 text-white'
                        : message.sender_type === 'BOT'
                        ? 'bg-gray-200 text-gray-900'
                        : 'bg-green-200 text-green-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getSenderColor(message.sender_type)}`}>
                        {getSenderIcon(message.sender_type)}
                        <span className="ml-1">
                          {message.sender_type === 'BOT' ? 'Bot' : 
                           message.sender_type === 'CUSTOMER' ? 'Cliente' : 'Atendente'}
                        </span>
                      </span>
                    </div>
                    
                    <p className="text-sm">{message.content}</p>
                    
                    <p className={`text-xs mt-1 ${
                      message.sender_type === 'CUSTOMER' ? 'text-indigo-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        {conversation.status === 'OPEN' && (
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Digite sua mensagem..."
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {conversation.status !== 'OPEN' && (
          <div className="bg-yellow-50 border-t border-yellow-200 p-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-yellow-800">
                {conversation.status === 'CLOSED' 
                  ? 'Esta conversa foi encerrada'
                  : conversation.status === 'BOT'
                  ? 'Esta conversa está sendo atendida pelo bot'
                  : 'Esta conversa está na fila de atendimento'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Context Panel */}
      <CustomerContextPanel conversationId={conversationId} />
    </div>
  );
};

export default ConversationDetailPage;

