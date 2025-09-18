"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoSeeder = void 0;
const connection_1 = require("./connection");
const bcrypt_1 = __importDefault(require("bcrypt"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class DemoSeeder {
    static async seedDemoData() {
        try {
            console.log('🌱 Iniciando seeding dos dados de demonstração...');
            // Gerar hash da senha demo123
            const demoPassword = await bcrypt_1.default.hash('demo123', 10);
            console.log('🔐 Senha demo gerada');
            // Ler arquivo SQL de seeding
            const sqlPath = path_1.default.join(__dirname, 'seed-demo.sql');
            let sqlContent = fs_1.default.readFileSync(sqlPath, 'utf8');
            // Substituir placeholder da senha pelo hash real
            sqlContent = sqlContent.replace(/\$2b\$10\$rQZ8kHWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQOWKQO/g, demoPassword);
            // Executar SQL de seeding
            await (0, connection_1.query)(sqlContent);
            console.log('✅ Dados de demonstração inseridos com sucesso!');
            console.log('');
            console.log('👤 Usuários criados:');
            console.log('   📧 demo@plataforma.com (Admin) - Senha: demo123');
            console.log('   📧 atendente@plataforma.com (Agent) - Senha: demo123');
            console.log('   📧 supervisor@plataforma.com (Supervisor) - Senha: demo123');
            console.log('');
            console.log('🏢 Empresa: Empresa Demonstração Ltda');
            console.log('👥 Equipe: Equipe Demonstração');
            console.log('🤖 Fluxo: Fluxo de Demonstração (publicado)');
            console.log('💬 Conversas de exemplo criadas');
            console.log('⚙️ Ações de escrita configuradas');
            console.log('');
            console.log('🎯 Para ativar o Modo Demo, faça login com demo@plataforma.com');
        }
        catch (error) {
            console.error('❌ Erro ao executar seeding:', error);
            throw error;
        }
    }
    static async clearDemoData() {
        try {
            console.log('🧹 Limpando dados de demonstração...');
            // Remover dados de demo (em ordem para respeitar foreign keys)
            await (0, connection_1.query)(`
        DELETE FROM messages WHERE conversation_id IN (
          SELECT id FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste')
        );
        
        DELETE FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste');
        
        DELETE FROM conversation_variables WHERE conversation_id IN (
          SELECT id FROM conversations WHERE customer_name IN ('Maria Adimplente', 'João Inadimplente', 'Cliente Teste')
        );
        
        DELETE FROM chatbot_flows WHERE name = 'Fluxo de Demonstração';
        
        DELETE FROM write_actions WHERE name IN ('Atualizar Dados de Contato', 'Consultar Cliente', 'Consultar Faturas');
        
        DELETE FROM system_messages WHERE message_key IN ('WELCOME_MESSAGE', 'TRANSFER_TO_AGENT_MESSAGE', 'ERROR_MESSAGE', 'GOODBYE_MESSAGE', 'BUSINESS_HOURS_MESSAGE', 'QUEUE_MESSAGE');
        
        DELETE FROM settings WHERE key IN ('company_name', 'erp_api_url', 'erp_api_key', 'whatsapp_token', 'whatsapp_phone_id');
        
        DELETE FROM users WHERE email IN ('demo@plataforma.com', 'atendente@plataforma.com', 'supervisor@plataforma.com');
        
        DELETE FROM teams WHERE name = 'Equipe Demonstração';
      `);
            console.log('✅ Dados de demonstração removidos com sucesso!');
        }
        catch (error) {
            console.error('❌ Erro ao limpar dados de demo:', error);
            throw error;
        }
    }
}
exports.DemoSeeder = DemoSeeder;
// Executar seeding se chamado diretamente
if (require.main === module) {
    const command = process.argv[2];
    if (command === 'clear') {
        DemoSeeder.clearDemoData()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
    else {
        DemoSeeder.seedDemoData()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}
//# sourceMappingURL=seed-demo.js.map