import { WriteAction } from '../types';
export declare class WriteActionModel {
    static create(data: Omit<WriteAction, 'id' | 'created_at' | 'updated_at'>): Promise<WriteAction>;
    static findAll(activeOnly?: boolean): Promise<WriteAction[]>;
    static findById(id: string): Promise<WriteAction | null>;
    static update(id: string, data: Partial<Omit<WriteAction, 'id' | 'created_at' | 'updated_at'>>): Promise<WriteAction | null>;
    static delete(id: string): Promise<boolean>;
    static toggleActive(id: string): Promise<WriteAction | null>;
    static replaceVariables(template: string, variables: Record<string, string>): string;
    static validateJsonTemplate(template: string): {
        valid: boolean;
        error?: string;
    };
    static extractVariables(template: string): string[];
}
//# sourceMappingURL=WriteAction.d.ts.map