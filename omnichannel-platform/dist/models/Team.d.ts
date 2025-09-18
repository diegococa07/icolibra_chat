import { Pool } from 'pg';
import { Team } from '../types';
export declare class TeamModel {
    private pool;
    constructor(pool: Pool);
    create(name: string): Promise<Team>;
    findAll(): Promise<Team[]>;
    findById(id: string): Promise<Team | null>;
    update(id: string, name: string): Promise<Team | null>;
    delete(id: string): Promise<boolean>;
    findAllWithMemberCount(): Promise<(Team & {
        member_count: number;
    })[]>;
    getTeamMembers(teamId: string): Promise<any[]>;
}
//# sourceMappingURL=Team.d.ts.map