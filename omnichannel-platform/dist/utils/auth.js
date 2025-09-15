"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityUtils = exports.ValidationUtils = exports.TwoFactorUtils = exports.JWTUtils = exports.PasswordUtils = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const types_1 = require("../types");
// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;
// Utilitários de senha
class PasswordUtils {
    // Hash da senha
    static async hashPassword(password) {
        return await bcryptjs_1.default.hash(password, BCRYPT_ROUNDS);
    }
    // Verificar senha
    static async verifyPassword(password, hashedPassword) {
        return await bcryptjs_1.default.compare(password, hashedPassword);
    }
    // Validar força da senha
    static validatePasswordStrength(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Senha deve ter pelo menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra maiúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Senha deve conter pelo menos uma letra minúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('Senha deve conter pelo menos um número');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Senha deve conter pelo menos um caractere especial');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.PasswordUtils = PasswordUtils;
// Utilitários de JWT
class JWTUtils {
    // Gerar token temporário (para configuração de 2FA)
    static generateTemporaryToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            is2FAVerified: false,
            type: 'temporary'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: '30m' // Token temporário expira em 30 minutos
        });
    }
    // Gerar token completo (após verificação de 2FA)
    static generateFullToken(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            is2FAVerified: true,
            type: 'full'
        };
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }
    // Verificar e decodificar token
    static verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return decoded;
        }
        catch (error) {
            console.error('Erro ao verificar token:', error);
            return null;
        }
    }
    // Gerar resposta de token formatada
    static generateTokenResponse(user, tokenType) {
        const token = tokenType === 'temporary'
            ? this.generateTemporaryToken(user)
            : this.generateFullToken(user);
        return {
            token,
            expiresIn: tokenType === 'temporary' ? '30m' : JWT_EXPIRES_IN,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                is_two_factor_enabled: user.is_two_factor_enabled
            }
        };
    }
}
exports.JWTUtils = JWTUtils;
// Utilitários de 2FA
class TwoFactorUtils {
    // Gerar segredo para 2FA
    static generateSecret() {
        return otplib_1.authenticator.generateSecret();
    }
    // Gerar URL de autenticação para QR Code
    static generateAuthURL(email, secret) {
        const serviceName = 'Omnichannel Platform';
        const accountName = email;
        return otplib_1.authenticator.keyuri(accountName, serviceName, secret);
    }
    // Gerar QR Code como Data URL
    static async generateQRCode(authURL) {
        try {
            const qrCodeDataURL = await qrcode_1.default.toDataURL(authURL, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrCodeDataURL;
        }
        catch (error) {
            console.error('Erro ao gerar QR Code:', error);
            throw new Error('Falha ao gerar QR Code');
        }
    }
    // Verificar token 2FA
    static verifyToken(token, secret) {
        try {
            // Remove espaços e caracteres não numéricos
            const cleanToken = token.replace(/\s/g, '').replace(/\D/g, '');
            if (cleanToken.length !== 6) {
                return false;
            }
            return otplib_1.authenticator.verify({
                token: cleanToken,
                secret: secret
            });
        }
        catch (error) {
            console.error('Erro ao verificar token 2FA:', error);
            return false;
        }
    }
    // Gerar dados completos para configuração de 2FA
    static async generate2FASetup(email) {
        const secret = this.generateSecret();
        const authURL = this.generateAuthURL(email, secret);
        const qrCodeDataURL = await this.generateQRCode(authURL);
        return {
            secret,
            authURL,
            qrCodeDataURL
        };
    }
}
exports.TwoFactorUtils = TwoFactorUtils;
// Utilitários de validação
class ValidationUtils {
    // Validar email
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    // Validar token 2FA
    static isValid2FAToken(token) {
        const cleanToken = token.replace(/\s/g, '').replace(/\D/g, '');
        return cleanToken.length === 6 && /^\d{6}$/.test(cleanToken);
    }
    // Sanitizar entrada de usuário
    static sanitizeInput(input) {
        return input.trim().toLowerCase();
    }
    // Validar role de usuário
    static isValidUserRole(role) {
        return Object.values(types_1.UserRole).includes(role);
    }
}
exports.ValidationUtils = ValidationUtils;
// Utilitários de segurança
class SecurityUtils {
    // Gerar ID de sessão único
    static generateSessionId() {
        return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Verificar rate limiting
    static checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const attempt = this.attempts.get(identifier);
        if (!attempt || (now - attempt.lastAttempt) > windowMs) {
            // Primeira tentativa ou janela expirou
            this.attempts.set(identifier, { count: 1, lastAttempt: now });
            return {
                allowed: true,
                remainingAttempts: maxAttempts - 1,
                resetTime: now + windowMs
            };
        }
        if (attempt.count >= maxAttempts) {
            // Limite excedido
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: attempt.lastAttempt + windowMs
            };
        }
        // Incrementar tentativas
        attempt.count++;
        attempt.lastAttempt = now;
        this.attempts.set(identifier, attempt);
        return {
            allowed: true,
            remainingAttempts: maxAttempts - attempt.count,
            resetTime: attempt.lastAttempt + windowMs
        };
    }
    // Limpar tentativas antigas
    static cleanupOldAttempts() {
        const now = Date.now();
        const windowMs = 15 * 60 * 1000; // 15 minutos
        for (const [key, attempt] of this.attempts.entries()) {
            if ((now - attempt.lastAttempt) > windowMs) {
                this.attempts.delete(key);
            }
        }
    }
}
exports.SecurityUtils = SecurityUtils;
// Rate limiting simples (em memória)
SecurityUtils.attempts = new Map();
// Limpar tentativas antigas a cada 5 minutos
setInterval(() => {
    SecurityUtils.cleanupOldAttempts();
}, 5 * 60 * 1000);
//# sourceMappingURL=auth.js.map