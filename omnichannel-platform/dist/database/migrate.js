"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const connection_1 = require("./connection");
const runMigrations = async () => {
    try {
        console.log('🚀 Iniciando processo de migração...');
        // Testar conexão
        const isConnected = await (0, connection_1.testConnection)();
        if (!isConnected) {
            throw new Error('Não foi possível conectar ao banco de dados');
        }
        // Ler arquivo de migração
        const migrationPath = (0, path_1.join)(__dirname, 'migrations.sql');
        const migrationSQL = (0, fs_1.readFileSync)(migrationPath, 'utf8');
        console.log('📄 Executando migrations...');
        // Executar migration
        await connection_1.pool.query(migrationSQL);
        console.log('✅ Migrations executadas com sucesso!');
        // Verificar se as tabelas foram criadas
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
        const result = await connection_1.pool.query(tablesQuery);
        console.log('📋 Tabelas criadas:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
    }
    catch (error) {
        console.error('❌ Erro durante a migração:', error);
        throw error;
    }
    finally {
        await connection_1.pool.end();
    }
};
exports.runMigrations = runMigrations;
// Executar migrations se o script for chamado diretamente
if (require.main === module) {
    runMigrations()
        .then(() => {
        console.log('🎉 Processo de migração concluído!');
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Falha na migração:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=migrate.js.map