"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamModel = void 0;
class TeamModel {
    constructor(pool) {
        this.pool = pool;
    }
    // Criar nova equipe
    async create(name) {
        const query = `
      INSERT INTO teams (id, name, created_at)
      VALUES (uuid_generate_v4(), $1, NOW())
      RETURNING id, name, created_at
    `;
        const result = await this.pool.query(query, [name]);
        return result.rows[0];
    }
    // Buscar todas as equipes
    async findAll() {
        const query = `
      SELECT id, name, created_at
      FROM teams
      ORDER BY name ASC
    `;
        const result = await this.pool.query(query);
        return result.rows;
    }
    // Buscar equipe por ID
    async findById(id) {
        const query = `
      SELECT id, name, created_at
      FROM teams
      WHERE id = $1
    `;
        const result = await this.pool.query(query, [id]);
        return result.rows[0] || null;
    }
    // Atualizar equipe
    async update(id, name) {
        const query = `
      UPDATE teams
      SET name = $2
      WHERE id = $1
      RETURNING id, name, created_at
    `;
        const result = await this.pool.query(query, [id, name]);
        return result.rows[0] || null;
    }
    // Deletar equipe
    async delete(id) {
        // Primeiro, verificar se há usuários associados à equipe
        const usersQuery = `
      SELECT COUNT(*) as user_count
      FROM users
      WHERE team_id = $1
    `;
        const usersResult = await this.pool.query(usersQuery, [id]);
        const userCount = parseInt(usersResult.rows[0].user_count);
        if (userCount > 0) {
            throw new Error('Não é possível excluir uma equipe que possui usuários associados');
        }
        const query = `
      DELETE FROM teams
      WHERE id = $1
    `;
        const result = await this.pool.query(query, [id]);
        return result.rowCount > 0;
    }
    // Buscar equipes com contagem de membros
    async findAllWithMemberCount() {
        const query = `
      SELECT 
        t.id, 
        t.name, 
        t.created_at,
        COUNT(u.id) as member_count
      FROM teams t
      LEFT JOIN users u ON t.id = u.team_id
      GROUP BY t.id, t.name, t.created_at
      ORDER BY t.name ASC
    `;
        const result = await this.pool.query(query);
        return result.rows.map(row => ({
            ...row,
            member_count: parseInt(row.member_count)
        }));
    }
    // Buscar membros de uma equipe
    async getTeamMembers(teamId) {
        const query = `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role,
        u.created_at
      FROM users u
      WHERE u.team_id = $1
      ORDER BY u.full_name ASC
    `;
        const result = await this.pool.query(query, [teamId]);
        return result.rows;
    }
}
exports.TeamModel = TeamModel;
//# sourceMappingURL=Team.js.map