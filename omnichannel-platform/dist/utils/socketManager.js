"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitConversationClosed = exports.emitConversationAssigned = exports.emitMessageReceived = exports.emitConversationUpdated = exports.emitNewConversation = exports.socketManager = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }
    // Inicializar Socket.IO server
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });
        // Middleware de autenticação
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
                if (!token) {
                    return next(new Error('Token de autenticação não fornecido'));
                }
                // Verificar token JWT
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
                if (decoded.scope !== 'complete') {
                    return next(new Error('Token com escopo insuficiente'));
                }
                // Buscar usuário no banco
                const user = await User_1.UserModel.findById(decoded.userId);
                if (!user) {
                    return next(new Error('Usuário não encontrado'));
                }
                // Adicionar dados do usuário ao socket
                socket.data.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
                next();
            }
            catch (error) {
                console.error('Erro na autenticação do socket:', error);
                next(new Error('Token inválido'));
            }
        });
        // Eventos de conexão
        this.io.on('connection', (socket) => {
            const user = socket.data.user;
            console.log(`Usuário conectado via WebSocket: ${user.name} (${user.id})`);
            // Registrar usuário conectado
            this.connectedUsers.set(socket.id, {
                userId: user.id,
                socketId: socket.id,
                role: user.role,
                connectedAt: new Date()
            });
            // Entrar em sala baseada no role
            socket.join(`role_${user.role.toLowerCase()}`);
            socket.join(`user_${user.id}`);
            // Enviar status de conexão
            socket.emit('connection_status', {
                status: 'connected',
                user: user,
                connectedAt: new Date()
            });
            // Eventos personalizados
            socket.on('join_conversation', (conversationId) => {
                socket.join(`conversation_${conversationId}`);
                console.log(`Usuário ${user.name} entrou na conversa ${conversationId}`);
            });
            socket.on('leave_conversation', (conversationId) => {
                socket.leave(`conversation_${conversationId}`);
                console.log(`Usuário ${user.name} saiu da conversa ${conversationId}`);
            });
            socket.on('typing_start', (conversationId) => {
                socket.to(`conversation_${conversationId}`).emit('user_typing', {
                    userId: user.id,
                    userName: user.name,
                    conversationId,
                    isTyping: true
                });
            });
            socket.on('typing_stop', (conversationId) => {
                socket.to(`conversation_${conversationId}`).emit('user_typing', {
                    userId: user.id,
                    userName: user.name,
                    conversationId,
                    isTyping: false
                });
            });
            // Evento de desconexão
            socket.on('disconnect', (reason) => {
                console.log(`Usuário desconectado: ${user.name} (${reason})`);
                this.connectedUsers.delete(socket.id);
            });
        });
        console.log('Socket.IO server inicializado com sucesso');
    }
    // Emitir notificação para usuários específicos
    emitNotification(event) {
        if (!this.io) {
            console.error('Socket.IO não foi inicializado');
            return;
        }
        try {
            // Emitir para roles específicos
            if (event.targetRoles && event.targetRoles.length > 0) {
                event.targetRoles.forEach(role => {
                    this.io.to(`role_${role.toLowerCase()}`).emit('notification', {
                        type: event.type,
                        data: event.data,
                        timestamp: new Date()
                    });
                });
            }
            // Emitir para usuários específicos
            if (event.targetUsers && event.targetUsers.length > 0) {
                event.targetUsers.forEach(userId => {
                    this.io.to(`user_${userId}`).emit('notification', {
                        type: event.type,
                        data: event.data,
                        timestamp: new Date()
                    });
                });
            }
            // Se não especificou targets, emitir para todos
            if (!event.targetRoles && !event.targetUsers) {
                this.io.emit('notification', {
                    type: event.type,
                    data: event.data,
                    timestamp: new Date()
                });
            }
            console.log(`Notificação emitida: ${event.type}`, event.data);
        }
        catch (error) {
            console.error('Erro ao emitir notificação:', error);
        }
    }
    // Emitir evento para conversa específica
    emitToConversation(conversationId, event, data) {
        if (!this.io) {
            console.error('Socket.IO não foi inicializado');
            return;
        }
        this.io.to(`conversation_${conversationId}`).emit(event, {
            ...data,
            timestamp: new Date()
        });
        console.log(`Evento ${event} emitido para conversa ${conversationId}`, data);
    }
    // Obter usuários conectados
    getConnectedUsers() {
        return Array.from(this.connectedUsers.values());
    }
    // Obter usuários conectados por role
    getConnectedUsersByRole(role) {
        return Array.from(this.connectedUsers.values()).filter(user => user.role === role);
    }
    // Verificar se usuário está conectado
    isUserConnected(userId) {
        return Array.from(this.connectedUsers.values()).some(user => user.userId === userId);
    }
    // Obter estatísticas de conexão
    getConnectionStats() {
        const connections = this.getConnectedUsers();
        return {
            totalConnected: connections.length,
            adminCount: connections.filter(u => u.role === 'ADMIN').length,
            agentCount: connections.filter(u => u.role === 'AGENT').length,
            connections
        };
    }
}
// Instância singleton
exports.socketManager = new SocketManager();
// Funções de conveniência para emitir eventos específicos
const emitNewConversation = (conversationData) => {
    exports.socketManager.emitNotification({
        type: 'NEW_CONVERSATION',
        data: conversationData,
        targetRoles: ['ADMIN', 'AGENT']
    });
};
exports.emitNewConversation = emitNewConversation;
const emitConversationUpdated = (conversationData, targetUsers) => {
    exports.socketManager.emitNotification({
        type: 'CONVERSATION_UPDATED',
        data: conversationData,
        targetRoles: ['ADMIN', 'AGENT'],
        targetUsers
    });
};
exports.emitConversationUpdated = emitConversationUpdated;
const emitMessageReceived = (messageData, conversationId) => {
    // Emitir para usuários na conversa
    exports.socketManager.emitToConversation(conversationId, 'new_message', messageData);
    // Emitir notificação geral
    exports.socketManager.emitNotification({
        type: 'MESSAGE_RECEIVED',
        data: { ...messageData, conversationId },
        targetRoles: ['ADMIN', 'AGENT']
    });
};
exports.emitMessageReceived = emitMessageReceived;
const emitConversationAssigned = (conversationData, assigneeId) => {
    exports.socketManager.emitNotification({
        type: 'CONVERSATION_ASSIGNED',
        data: conversationData,
        targetUsers: [assigneeId],
        targetRoles: ['ADMIN']
    });
};
exports.emitConversationAssigned = emitConversationAssigned;
const emitConversationClosed = (conversationData) => {
    exports.socketManager.emitNotification({
        type: 'CONVERSATION_CLOSED',
        data: conversationData,
        targetRoles: ['ADMIN', 'AGENT']
    });
};
exports.emitConversationClosed = emitConversationClosed;
//# sourceMappingURL=socketManager.js.map