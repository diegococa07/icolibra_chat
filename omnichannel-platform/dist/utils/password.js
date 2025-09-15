"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordGenerator = void 0;
const crypto_1 = __importDefault(require("crypto"));
class PasswordGenerator {
    // Gerar senha provisória segura
    static generateProvisionalPassword(length = 12) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        // Garantir pelo menos um de cada tipo
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        // Adicionar pelo menos um caractere de cada tipo
        password += uppercase[crypto_1.default.randomInt(0, uppercase.length)];
        password += lowercase[crypto_1.default.randomInt(0, lowercase.length)];
        password += numbers[crypto_1.default.randomInt(0, numbers.length)];
        password += symbols[crypto_1.default.randomInt(0, symbols.length)];
        // Preencher o resto com caracteres aleatórios
        for (let i = password.length; i < length; i++) {
            password += charset[crypto_1.default.randomInt(0, charset.length)];
        }
        // Embaralhar a senha para não ter padrão previsível
        return password.split('').sort(() => crypto_1.default.randomInt(0, 3) - 1).join('');
    }
    // Gerar senha mais simples para demonstração (apenas alfanumérica)
    static generateSimplePassword(length = 10) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[crypto_1.default.randomInt(0, charset.length)];
        }
        return password;
    }
    // Validar se senha atende critérios mínimos
    static validatePassword(password) {
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
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
exports.PasswordGenerator = PasswordGenerator;
//# sourceMappingURL=password.js.map