'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketNotification {
  type: 'NEW_CONVERSATION' | 'CONVERSATION_UPDATED' | 'MESSAGE_RECEIVED' | 'CONVERSATION_ASSIGNED' | 'CONVERSATION_CLOSED';
  data: any;
  timestamp: string;
}

interface UseSocketOptions {
  autoConnect?: boolean;
  onNotification?: (notification: SocketNotification) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, onNotification, onConnectionChange } = options;
  
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Obter token de autenticação
  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Conectar ao socket
  const connect = () => {
    const token = getToken();
    if (!token) {
      setConnectionError('Token de autenticação não encontrado');
      return;
    }

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    socketRef.current = io(API_BASE_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: false
    });

    const socket = socketRef.current;

    // Eventos de conexão
    socket.on('connect', () => {
      console.log('WebSocket conectado:', socket.id);
      setIsConnected(true);
      setConnectionError(null);
      onConnectionChange?.(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket desconectado:', reason);
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
      setConnectionError(error.message);
      setIsConnected(false);
      onConnectionChange?.(false);
    });

    // Status de conexão
    socket.on('connection_status', (data) => {
      console.log('Status de conexão recebido:', data);
    });

    // Notificações
    socket.on('notification', (notification: SocketNotification) => {
      console.log('Notificação recebida:', notification);
      onNotification?.(notification);
    });

    // Mensagens em tempo real
    socket.on('new_message', (messageData) => {
      console.log('Nova mensagem recebida:', messageData);
      // Pode ser tratada separadamente se necessário
    });

    // Indicador de digitação
    socket.on('user_typing', (typingData) => {
      console.log('Usuário digitando:', typingData);
      // Implementar indicador de digitação se necessário
    });

    // Conectar
    socket.connect();
  };

  // Desconectar do socket
  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setConnectionError(null);
      onConnectionChange?.(false);
    }
  };

  // Entrar em uma conversa específica
  const joinConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_conversation', conversationId);
    }
  };

  // Sair de uma conversa específica
  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_conversation', conversationId);
    }
  };

  // Indicar que está digitando
  const startTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_start', conversationId);
    }
  };

  // Indicar que parou de digitar
  const stopTyping = (conversationId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing_stop', conversationId);
    }
  };

  // Reconectar
  const reconnect = () => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  };

  // Efeito para conectar automaticamente
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup na desmontagem
    return () => {
      disconnect();
    };
  }, [autoConnect]);

  // Efeito para reconectar quando o token muda
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue) {
          reconnect();
        } else {
          disconnect();
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, []);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    reconnect,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    socket: socketRef.current
  };
};

