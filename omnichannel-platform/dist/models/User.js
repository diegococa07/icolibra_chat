"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const uuid_1 = require("uuid");
const connection_1 = require("../database/connection");
class UserModel {
    // Criar um novo usuário
    static async create(userData) {
        const id = (0, uuid_1.v4)();
        const { email, full_name, encrypted_password, role, two_factor_secret, is_two_factor_enabled = false } = userData;
        const sql = `
      INSERT INTO users (id, email, full_name, encrypted_password, role, two_factor_secret, is_two_factor_enabled)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const values = [id, email, full_name, encrypted_password, role, two_factor_secret, is_two_factor_enabled];
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0];
    }
    // Buscar usuário por ID
    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return result.rows[0] || null;
    }
    // Buscar usuário por email
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = $1';
        const result = await (0, connection_1.query)(sql, [email]);
        return result.rows[0] || null;
    }
    // Listar todos os usuários
    static async findAll() {
        const sql = 'SELECT * FROM users ORDER BY created_at DESC';
        const result = await (0, connection_1.query)(sql);
        return result.rows;
    }
    // Listar usuários por role
    static async findByRole(role) {
        const sql = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
        const result = await (0, connection_1.query)(sql, [role]);
        return result.rows;
    }
    // Atualizar usuário
    static async update(id, updateData) {
        const fields = [];
        const values = [];
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
        const result = await (0, connection_1.query)(sql, values);
        return result.rows[0] || null;
    }
    // Deletar usuário
    static async delete(id) {
        const sql = 'DELETE FROM users WHERE id = $1';
        const result = await (0, connection_1.query)(sql, [id]);
        return (result.rowCount || 0) > 0;
    }
    // Ativar/desativar 2FA
    static async toggleTwoFactor(id, enabled, secret) {
        const sql = `
      UPDATE users 
      SET is_two_factor_enabled = $1, two_factor_secret = $2
      WHERE id = $3
      RETURNING *
    `;
        const result = await (0, connection_1.query)(sql, [enabled, secret, id]);
        return result.rows[0] || null;
    }
    // Contar usuários por role
    static async countByRole() {
        const sql = `
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
        const result = await (0, connection_1.query)(sql);
        return result.rows.map(row => ({
            role: row.role,
            count: parseInt(row.count)
        }));
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map