import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { campaignSender } from '../../jobs/campaignSender';
import { CampaignModel } from '../../models/Campaign';
import { MessageTemplateModel } from '../../models/MessageTemplate';
import { queueManager } from '../../jobs/queue';
import { CampaignStatus } from '../../types';
import * as erpIntegration from '../../utils/campaignErpIntegration';

// Mock das dependências
jest.mock('../../models/Campaign');
jest.mock('../../models/MessageTemplate');
jest.mock('../../jobs/queue');
jest.mock('../../utils/logger');
jest.mock('../../utils/campaignErpIntegration');

describe('Campaign Sender', () => {
  beforeEach(() => {
    // Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpar todos os mocks após cada teste
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    // Arrange
    const createWorkerSpy = jest.spyOn(queueManager, 'createWorker');
    
    // Act
    campaignSender.initialize();
    
    // Assert
    expect(createWorkerSpy).toHaveBeenCalledTimes(1);
    expect(createWorkerSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      expect.any(Number)
    );
  });

  it('should process campaign correctly', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
      },
      updateProgress: jest.fn(),
    };
    
    const mockCampaign = {
      id: '123',
      name: 'Test Campaign',
      message_template_id: '456',
      target_criteria: { region: 'Sudeste' },
      template_variables: { company: 'Test Company' },
    };
    
    const mockTemplate = {
      id: '456',
      name: 'Test Template',
      body: 'Hello {{1}}, welcome to {{company}}',
      whatsapp_template_id: 'template123',
    };
    
    const mockCustomers = [
      { id: '1', name: 'John Doe', phone: '5511999999999' },
      { id: '2', name: 'Jane Smith', phone: '5511888888888' },
    ];
    
    // Mock do método findById do CampaignModel
    (CampaignModel.prototype.findById as jest.Mock).mockResolvedValue(mockCampaign);
    
    // Mock do método findById do MessageTemplateModel
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(mockTemplate);
    
    // Mock da função fetchTargetCustomers
    (erpIntegration.fetchTargetCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    
    // Mock do método updateStatus
    (CampaignModel.prototype.updateStatus as jest.Mock).mockResolvedValue(true);
    
    // Mock da função addMessageProcessorJob
    const addJobSpy = jest.spyOn(queueManager, 'addJob');
    
    // Act
    await campaignSender.process(mockJob as any);
    
    // Assert
    expect(CampaignModel.prototype.findById).toHaveBeenCalledWith('123');
    expect(MessageTemplateModel.prototype.findById).toHaveBeenCalledWith('456');
    expect(erpIntegration.fetchTargetCustomers).toHaveBeenCalledWith({ region: 'Sudeste' });
    expect(mockJob.updateProgress).toHaveBeenCalledTimes(3); // Início, meio e fim
    expect(addJobSpy).toHaveBeenCalledTimes(2); // Um job para cada cliente
    expect(CampaignModel.prototype.updateStatus).toHaveBeenCalledWith('123', CampaignStatus.COMPLETED);
  });

  it('should handle campaign not found', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
      },
      updateProgress: jest.fn(),
    };
    
    // Mock do método findById retornando null
    (CampaignModel.prototype.findById as jest.Mock).mockResolvedValue(null);
    
    // Act & Assert
    await expect(campaignSender.process(mockJob as any)).rejects.toThrow('Campaign not found');
  });

  it('should handle template not found', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
      },
      updateProgress: jest.fn(),
    };
    
    const mockCampaign = {
      id: '123',
      name: 'Test Campaign',
      message_template_id: '456',
      target_criteria: { region: 'Sudeste' },
      template_variables: { company: 'Test Company' },
    };
    
    // Mock do método findById do CampaignModel
    (CampaignModel.prototype.findById as jest.Mock).mockResolvedValue(mockCampaign);
    
    // Mock do método findById do MessageTemplateModel retornando null
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(null);
    
    // Act & Assert
    await expect(campaignSender.process(mockJob as any)).rejects.toThrow('Template not found');
  });

  it('should handle no customers found', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
      },
      updateProgress: jest.fn(),
    };
    
    const mockCampaign = {
      id: '123',
      name: 'Test Campaign',
      message_template_id: '456',
      target_criteria: { region: 'Sudeste' },
      template_variables: { company: 'Test Company' },
    };
    
    const mockTemplate = {
      id: '456',
      name: 'Test Template',
      body: 'Hello {{1}}, welcome to {{company}}',
      whatsapp_template_id: 'template123',
    };
    
    // Mock do método findById do CampaignModel
    (CampaignModel.prototype.findById as jest.Mock).mockResolvedValue(mockCampaign);
    
    // Mock do método findById do MessageTemplateModel
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(mockTemplate);
    
    // Mock da função fetchTargetCustomers retornando array vazio
    (erpIntegration.fetchTargetCustomers as jest.Mock).mockResolvedValue([]);
    
    // Mock do método updateStatus
    (CampaignModel.prototype.updateStatus as jest.Mock).mockResolvedValue(true);
    
    // Act
    await campaignSender.process(mockJob as any);
    
    // Assert
    expect(CampaignModel.prototype.updateStatus).toHaveBeenCalledWith('123', CampaignStatus.COMPLETED);
    expect(queueManager.addJob).not.toHaveBeenCalled();
  });
});

