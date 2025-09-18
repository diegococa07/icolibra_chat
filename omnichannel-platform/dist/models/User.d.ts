import { User, CreateUser, UserRole } from '../types';
export declare class UserModel {
    static create(userData: CreateUser): Promise<User>;
    static findById(id: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static findAll(): Promise<User[]>;
    static findByRole(role: UserRole): Promise<User[]>;
    static update(id: string, updateData: Partial<CreateUser>): Promise<User | null>;
    static delete(id: string): Promise<boolean>;
    static toggleTwoFactor(id: string, enabled: boolean, secret?: string): Promise<User | null>;
    static getStatsByRole(): Promise<Array<{
        role: UserRole;
        count: number;
    }>>;
    static findByTeamId(teamId: string): Promise<User[]>;
    static getSupervisorTeamId(supervisorId: string): Promise<string | null>;
}
//# sourceMappingURL=User.d.ts.map