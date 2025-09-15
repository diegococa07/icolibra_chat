import { readFileSync } from 'fs';
import { join } from 'path';
import { pool, testConnection } from './connection';

const runMigrations = async (): Promise<void> => {
  try {
    console.log('🚀 Iniciando processo de migração...');
    
    // Testar conexão
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }

    // Ler arquivo de migração
    const migrationPath = join(__dirname, 'migrations.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Executando migrations...');
    
    // Executar migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migrations executadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await pool.query(tablesQuery);
    console.log('📋 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

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

export { runMigrations };

