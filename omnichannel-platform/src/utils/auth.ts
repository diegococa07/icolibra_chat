import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { User, UserRole } from '../types';

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const BCRYPT_ROUNDS = 12;

// Interfaces para tokens
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  is2FAVerified: boolean;
  type: 'temporary' | 'full';
}

export interface TokenResponse {
  token: string;
  expiresIn: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
    is_two_factor_enabled: boolean;
  };
}

// Utilitários de senha
export class PasswordUtils {
  
  // Hash da senha
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // Verificar senha
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Validar força da senha
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

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

// Utilitários de JWT
export class JWTUtils {
  
  // Gerar token temporário (para configuração de 2FA)
  static generateTemporaryToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      is2FAVerified: false,
      type: 'temporary'
    };

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: '30m' // Token temporário expira em 30 minutos
    });
  }

  // Gerar token completo (após verificação de 2FA)
  static generateFullToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      is2FAVerified: true,
      type: 'full'
    };

    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN
    });
  }

  // Verificar e decodificar token
  static verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return null;
    }
  }

  // Gerar resposta de token formatada
  static generateTokenResponse(user: User, tokenType: 'temporary' | 'full'): TokenResponse {
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

// Utilitários de 2FA
export class TwoFactorUtils {
  
  // Gerar segredo para 2FA
  static generateSecret(): string {
    return authenticator.generateSecret();
  }

  // Gerar URL de autenticação para QR Code
  static generateAuthURL(email: string, secret: string): string {
    const serviceName = 'Omnichannel Platform';
    const accountName = email;
    
    return authenticator.keyuri(accountName, serviceName, secret);
  }

  // Gerar QR Code como Data URL
  static async generateQRCode(authURL: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(authURL, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      throw new Error('Falha ao gerar QR Code');
    }
  }

  // Verificar token 2FA
  static verifyToken(token: string, secret: string): boolean {
    try {
      // Remove espaços e caracteres não numéricos
      const cleanToken = token.replace(/\s/g, '').replace(/\D/g, '');
      
      if (cleanToken.length !== 6) {
        return false;
      }

      return authenticator.verify({
        token: cleanToken,
        secret: secret
      });
    } catch (error) {
      console.error('Erro ao verificar token 2FA:', error);
      return false;
    }
  }

  // Gerar dados completos para configuração de 2FA
  static async generate2FASetup(email: string): Promise<{
    secret: string;
    authURL: string;
    qrCodeDataURL: string;
  }> {
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

// Utilitários de validação
export class ValidationUtils {
  
  // Validar email
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validar token 2FA
  static isValid2FAToken(token: string): boolean {
    const cleanToken = token.replace(/\s/g, '').replace(/\D/g, '');
    return cleanToken.length === 6 && /^\d{6}$/.test(cleanToken);
  }

  // Sanitizar entrada de usuário
  static sanitizeInput(input: string): string {
    return input.trim().toLowerCase();
  }

  // Validar role de usuário
  static isValidUserRole(role: string): role is UserRole {
    return Object.values(UserRole).includes(role as UserRole);
  }
}

// Utilitários de segurança
export class SecurityUtils {
  
  // Gerar ID de sessão único
  static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Rate limiting simples (em memória)
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  // Verificar rate limiting
  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): {
    allowed: boolean;
    remainingAttempts: number;
    resetTime: number;
  } {
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
  static cleanupOldAttempts(): void {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutos

    for (const [key, attempt] of this.attempts.entries()) {
      if ((now - attempt.lastAttempt) > windowMs) {
        this.attempts.delete(key);
      }
    }
  }
}

// Limpar tentativas antigas a cada 5 minutos
setInterval(() => {
  SecurityUtils.cleanupOldAttempts();
}, 5 * 60 * 1000);

