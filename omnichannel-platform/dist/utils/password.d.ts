export declare class PasswordGenerator {
    static generateProvisionalPassword(length?: number): string;
    static generateSimplePassword(length?: number): string;
    static validatePassword(password: string): {
        isValid: boolean;
        errors: string[];
    };
}
//# sourceMappingURL=password.d.ts.map