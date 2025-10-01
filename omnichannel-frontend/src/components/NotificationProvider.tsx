'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Bell, CheckCircle, AlertCircle, MessageSquare, UserCheck, XCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'NEW_CONVERSATION' | 'CONVERSATION_UPDATED' | 'MESSAGE_RECEIVED' | 'CONVERSATION_ASSIGNED' | 'CONVERSATION_CLOSED';
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
  isConnected: boolean;
  connectionError: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const { isConnected, connectionError } = useSocket({
    autoConnect: true,
    onNotification: (socketNotification) => {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random()}`,
        type: socketNotification.type,
        title: getNotificationTitle(socketNotification.type),
        message: getNotificationMessage(socketNotification.type, socketNotification.data),
        data: socketNotification.data,
        timestamp: new Date(socketNotification.timestamp),
        read: false
      };

      setNotifications(prev => [notification, ...prev]);

      // Mostrar notificação do navegador se permitido
      showBrowserNotification(notification);

      // Tocar som de notificação se necessário
      playNotificationSound();
    }
  });

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'NEW_CONVERSATION':
        return 'Nova Conversa';
      case 'CONVERSATION_UPDATED':
        return 'Conversa Atualizada';
      case 'MESSAGE_RECEIVED':
        return 'Nova Mensagem';
      case 'CONVERSATION_ASSIGNED':
        return 'Conversa Atribuída';
      case 'CONVERSATION_CLOSED':
        return 'Conversa Encerrada';
      default:
        return 'Notificação';
    }
  };

  const getNotificationMessage = (type: string, data: any): string => {
    switch (type) {
      case 'NEW_CONVERSATION':
        return `Nova conversa iniciada por ${data.customer_identifier || 'cliente anônimo'}`;
      case 'CONVERSATION_UPDATED':
        return `Conversa ${data.id} foi atualizada para ${data.status}`;
      case 'MESSAGE_RECEIVED':
        return `Nova mensagem na conversa ${data.conversationId}`;
      case 'CONVERSATION_ASSIGNED':
        return `Conversa ${data.id} foi atribuída a você`;
      case 'CONVERSATION_CLOSED':
        return `Conversa ${data.id} foi encerrada`;
      default:
        return 'Você tem uma nova notificação';
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  const playNotificationSound = () => {
    // Implementar som de notificação se necessário
    // const audio = new Audio('/notification-sound.mp3');
    // audio.play().catch(e => console.log('Não foi possível reproduzir som:', e));
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Solicitar permissão para notificações na inicialização
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Limitar número de notificações armazenadas (máximo 100)
  useEffect(() => {
    if (notifications.length > 100) {
      setNotifications(prev => prev.slice(0, 100));
    }
  }, [notifications.length]);

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    isConnected,
    connectionError
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Componente de indicador de notificações para a barra superior
export const NotificationIndicator: React.FC = () => {
  const { unreadCount, isConnected, connectionError } = useNotifications();

  return (
    <div className="flex items-center space-x-2">
      {/* Indicador de conexão */}
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-600">
          {isConnected ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Indicador de notificações */}
      <div className="relative">
        <Bell className="h-5 w-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Erro de conexão */}
      {connectionError && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={connectionError}>
          Erro de conexão
        </div>
      )}
    </div>
  );
};

// Componente de lista de notificações
export const NotificationList: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { 
    notifications, 
    markAsRead, 
    clearNotification, 
    markAllAsRead, 
    clearAllNotifications 
  } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_CONVERSATION':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'CONVERSATION_UPDATED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'MESSAGE_RECEIVED':
        return <MessageSquare className="h-4 w-4 text-green-500" />;
      case 'CONVERSATION_ASSIGNED':
        return <UserCheck className="h-4 w-4 text-purple-500" />;
      case 'CONVERSATION_CLOSED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (notifications.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma notificação</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Notificações</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Marcar todas como lidas
          </button>
          <button
            onClick={clearAllNotifications}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Limpar todas
          </button>
        </div>
      </div>

      {/* Lista de notificações */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
              !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {notification.title}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                <p className="text-xs text-gray-400 mt-1">
                  {notification.timestamp.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

