"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowController = void 0;
const ChatbotFlow_1 = require("../models/ChatbotFlow");
const auth_1 = require("../utils/auth");
class FlowController {
    // GET /api/flows
    // Listar todos os fluxos (apenas para ADMIN)
    static async getFlows(req, res) {
        try {
            const flows = await ChatbotFlow_1.ChatbotFlowModel.findAll();
            res.status(200).json({
                message: 'Fluxos listados com sucesso',
                flows: flows,
                total: flows.length
            });
        }
        catch (error) {
            console.error('Erro ao listar fluxos:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/flows/:id
    // Obter um fluxo específico (apenas para ADMIN)
    static async getFlowById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do fluxo é obrigatório'
                });
                return;
            }
            const flow = await ChatbotFlow_1.ChatbotFlowModel.findById(id);
            if (!flow) {
                res.status(404).json({
                    error: 'Fluxo não encontrado'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo obtido com sucesso',
                flow: flow
            });
        }
        catch (error) {
            console.error('Erro ao obter fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/flows
    // Criar novo fluxo (apenas para ADMIN)
    static async createFlow(req, res) {
        try {
            const { name, description, flow_definition } = req.body;
            // Validações básicas
            if (!name || name.trim().length === 0) {
                res.status(400).json({
                    error: 'Nome do fluxo é obrigatório'
                });
                return;
            }
            // Verificar se já existe um fluxo com o mesmo nome
            const existingFlow = await ChatbotFlow_1.ChatbotFlowModel.findByName(name.trim());
            if (existingFlow) {
                res.status(400).json({
                    error: 'Já existe um fluxo com este nome'
                });
                return;
            }
            // Preparar dados para criação
            const flowData = {
                name: auth_1.ValidationUtils.sanitizeInput(name.trim()),
                description: description ? auth_1.ValidationUtils.sanitizeInput(description.trim()) : undefined,
                flow_definition: flow_definition || {},
                is_active: false // Novo fluxo sempre inicia inativo
            };
            const flow = await ChatbotFlow_1.ChatbotFlowModel.create(flowData);
            res.status(201).json({
                message: 'Fluxo criado com sucesso',
                flow: flow
            });
        }
        catch (error) {
            console.error('Erro ao criar fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // PUT /api/flows/:id
    // Atualizar fluxo existente (apenas para ADMIN)
    static async updateFlow(req, res) {
        try {
            const { id } = req.params;
            const { name, description, flow_definition, is_active } = req.body;
            if (!id) {
                res.status(400).json({
                    error: 'ID do fluxo é obrigatório'
                });
                return;
            }
            // Verificar se o fluxo existe
            const existingFlow = await ChatbotFlow_1.ChatbotFlowModel.findById(id);
            if (!existingFlow) {
                res.status(404).json({
                    error: 'Fluxo não encontrado'
                });
                return;
            }
            // Preparar dados para atualização
            const updateData = {};
            if (name !== undefined) {
                if (name.trim().length === 0) {
                    res.status(400).json({
                        error: 'Nome do fluxo não pode estar vazio'
                    });
                    return;
                }
                // Verificar se já existe outro fluxo com o mesmo nome
                const duplicateFlow = await ChatbotFlow_1.ChatbotFlowModel.findByName(name.trim());
                if (duplicateFlow && duplicateFlow.id !== id) {
                    res.status(400).json({
                        error: 'Já existe outro fluxo com este nome'
                    });
                    return;
                }
                updateData.name = auth_1.ValidationUtils.sanitizeInput(name.trim());
            }
            if (description !== undefined) {
                updateData.description = description ? auth_1.ValidationUtils.sanitizeInput(description.trim()) : null;
            }
            if (flow_definition !== undefined) {
                updateData.flow_definition = flow_definition;
            }
            if (is_active !== undefined) {
                updateData.is_active = Boolean(is_active);
            }
            // Se não há dados para atualizar
            if (Object.keys(updateData).length === 0) {
                res.status(400).json({
                    error: 'Nenhum dado válido fornecido para atualização'
                });
                return;
            }
            const updatedFlow = await ChatbotFlow_1.ChatbotFlowModel.update(id, updateData);
            if (!updatedFlow) {
                res.status(500).json({
                    error: 'Erro ao atualizar fluxo'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo atualizado com sucesso',
                flow: updatedFlow
            });
        }
        catch (error) {
            console.error('Erro ao atualizar fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // DELETE /api/flows/:id
    // Excluir fluxo (apenas para ADMIN)
    static async deleteFlow(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do fluxo é obrigatório'
                });
                return;
            }
            // Verificar se o fluxo existe
            const existingFlow = await ChatbotFlow_1.ChatbotFlowModel.findById(id);
            if (!existingFlow) {
                res.status(404).json({
                    error: 'Fluxo não encontrado'
                });
                return;
            }
            // Verificar se o fluxo está ativo
            if (existingFlow.is_active) {
                res.status(400).json({
                    error: 'Não é possível excluir um fluxo ativo. Desative-o primeiro.'
                });
                return;
            }
            const deleted = await ChatbotFlow_1.ChatbotFlowModel.delete(id);
            if (!deleted) {
                res.status(500).json({
                    error: 'Erro ao excluir fluxo'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo excluído com sucesso'
            });
        }
        catch (error) {
            console.error('Erro ao excluir fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/flows/:id/publish
    // Publicar/ativar fluxo (apenas para ADMIN)
    static async publishFlow(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do fluxo é obrigatório'
                });
                return;
            }
            // Verificar se o fluxo existe
            const existingFlow = await ChatbotFlow_1.ChatbotFlowModel.findById(id);
            if (!existingFlow) {
                res.status(404).json({
                    error: 'Fluxo não encontrado'
                });
                return;
            }
            // Verificar se o fluxo tem definição válida
            if (!existingFlow.flow_definition || Object.keys(existingFlow.flow_definition).length === 0) {
                res.status(400).json({
                    error: 'Não é possível publicar um fluxo vazio. Configure o fluxo primeiro.'
                });
                return;
            }
            // Desativar todos os outros fluxos (apenas um pode estar ativo)
            await ChatbotFlow_1.ChatbotFlowModel.deactivateAll();
            // Ativar o fluxo atual
            const updatedFlow = await ChatbotFlow_1.ChatbotFlowModel.update(id, { is_active: true });
            if (!updatedFlow) {
                res.status(500).json({
                    error: 'Erro ao publicar fluxo'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo publicado com sucesso',
                flow: updatedFlow
            });
        }
        catch (error) {
            console.error('Erro ao publicar fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // POST /api/flows/:id/unpublish
    // Despublicar/desativar fluxo (apenas para ADMIN)
    static async unpublishFlow(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({
                    error: 'ID do fluxo é obrigatório'
                });
                return;
            }
            // Verificar se o fluxo existe
            const existingFlow = await ChatbotFlow_1.ChatbotFlowModel.findById(id);
            if (!existingFlow) {
                res.status(404).json({
                    error: 'Fluxo não encontrado'
                });
                return;
            }
            // Desativar o fluxo
            const updatedFlow = await ChatbotFlow_1.ChatbotFlowModel.update(id, { is_active: false });
            if (!updatedFlow) {
                res.status(500).json({
                    error: 'Erro ao despublicar fluxo'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo despublicado com sucesso',
                flow: updatedFlow
            });
        }
        catch (error) {
            console.error('Erro ao despublicar fluxo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/flows/active
    // Obter fluxo ativo (público - usado pelo chatbot)
    static async getActiveFlow(req, res) {
        try {
            const activeFlow = await ChatbotFlow_1.ChatbotFlowModel.findActive();
            if (!activeFlow) {
                res.status(404).json({
                    error: 'Nenhum fluxo ativo encontrado'
                });
                return;
            }
            res.status(200).json({
                message: 'Fluxo ativo obtido com sucesso',
                flow: activeFlow
            });
        }
        catch (error) {
            console.error('Erro ao obter fluxo ativo:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
    // GET /api/flows/stats
    // Obter estatísticas dos fluxos (apenas para ADMIN)
    static async getFlowStats(req, res) {
        try {
            const flows = await ChatbotFlow_1.ChatbotFlowModel.findAll();
            const stats = {
                total: flows.length,
                active: flows.filter(f => f.is_active).length,
                inactive: flows.filter(f => !f.is_active).length,
                withDefinition: flows.filter(f => f.flow_definition && Object.keys(f.flow_definition).length > 0).length,
                empty: flows.filter(f => !f.flow_definition || Object.keys(f.flow_definition).length === 0).length
            };
            res.status(200).json({
                message: 'Estatísticas obtidas com sucesso',
                stats: stats
            });
        }
        catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    }
}
exports.FlowController = FlowController;
//# sourceMappingURL=FlowController.js.map