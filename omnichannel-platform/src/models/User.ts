import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { User, CreateUser, UserRole } from '../types';

export class UserModel {
  
  // Criar um novo usuário
  static async create(userData: CreateUser): Promise<User> {
    const id = uuidv4();
    const {
      email,
      full_name,
      encrypted_password,
      role,
      two_factor_secret,
      is_two_factor_enabled = false
    } = userData;

    const sql = `
      INSERT INTO users (id, email, full_name, encrypted_password, role, two_factor_secret, is_two_factor_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [id, email, full_name, encrypted_password, role, two_factor_secret, is_two_factor_enabled];
    const result = await query(sql, values);
    
    return result.rows[0];
  }

  // Buscar usuário por ID
  static async findById(id: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    
    return result.rows[0] || null;
  }

  // Buscar usuário por email
  static async findByEmail(email: string): Promise<User | null> {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    
    return result.rows[0] || null;
  }

  // Listar todos os usuários
  static async findAll(): Promise<User[]> {
    const sql = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await query(sql);
    
    return result.rows;
  }

  // Listar usuários por role
  static async findByRole(role: UserRole): Promise<User[]> {
    const sql = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
    const result = await query(sql, [role]);
    
    return result.rows;
  }

  // Atualizar usuário
  static async update(id: string, updateData: Partial<CreateUser>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Construir query dinamicamente baseada nos campos fornecidos
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('Nenhum campo para atualizar foi fornecido');
    }

    values.push(id); // ID sempre é o último parâmetro
    
    const sql = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(sql, values);
    
    return result.rows[0] || null;
  }

  // Deletar usuário
  static async delete(id: string): Promise<boolean> {
    const sql = 'DELETE FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    
    return (result.rowCount || 0) > 0;
  }

  // Ativar/desativar 2FA
  static async toggleTwoFactor(id: string, enabled: boolean, secret?: string): Promise<User | null> {
    const sql = `
      UPDATE users 
      SET is_two_factor_enabled = $1, two_factor_secret = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(sql, [enabled, secret, id]);
    
    return result.rows[0] || null;
  }

  // Estatísticas de usuários por role
  static async getStatsByRole(): Promise<Array<{role: UserRole, count: number}>> {
    const sql = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
    
    const result = await query(sql);
    
    return result.rows.map(row => ({
      role: row.role as UserRole,
      count: parseInt(row.count)
    }));
  }

  // Buscar usuários por team_id
  static async findByTeamId(teamId: string): Promise<User[]> {
    const sql = 'SELECT * FROM users WHERE team_id = $1 ORDER BY created_at DESC';
    const result = await query(sql, [teamId]);
    
    return result.rows;
  }

  // Buscar team_id do supervisor
  static async getSupervisorTeamId(supervisorId: string): Promise<string | null> {
    const sql = 'SELECT team_id FROM users WHERE id = $1 AND role = $2';
    const result = await query(sql, [supervisorId, UserRole.SUPERVISOR]);
    
    return result.rows[0]?.team_id || null;
  }
}