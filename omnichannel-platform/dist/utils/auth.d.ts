import { User, UserRole } from '../types';
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
export declare class PasswordUtils {
    static hashPassword(password: string): Promise<string>;
    static verifyPassword(password: string, hashedPassword: string): Promise<boolean>;
    static validatePasswordStrength(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
export declare class JWTUtils {
    static generateTemporaryToken(user: User): string;
    static generateFullToken(user: User): string;
    static verifyToken(token: string): JWTPayload | null;
    static generateTokenResponse(user: User, tokenType: 'temporary' | 'full'): TokenResponse;
}
export declare class TwoFactorUtils {
    static generateSecret(): string;
    static generateAuthURL(email: string, secret: string): string;
    static generateQRCode(authURL: string): Promise<string>;
    static verifyToken(token: string, secret: string): boolean;
    static generate2FASetup(email: string): Promise<{
        secret: string;
        authURL: string;
        qrCodeDataURL: string;
    }>;
}
export declare class ValidationUtils {
    static isValidEmail(email: string): boolean;
    static isValid2FAToken(token: string): boolean;
    static sanitizeInput(input: string): string;
    static isValidUserRole(role: string): role is UserRole;
}
export declare class SecurityUtils {
    static generateSessionId(): string;
    private static attempts;
    static checkRateLimit(identifier: string, maxAttempts?: number, windowMs?: number): {
        allowed: boolean;
        remainingAttempts: number;
        resetTime: number;
    };
    static cleanupOldAttempts(): void;
}
//# sourceMappingURL=auth.d.ts.map