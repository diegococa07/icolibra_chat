import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { messageProcessor } from '../../jobs/messageProcessor';
import { MessageTemplateModel } from '../../models/MessageTemplate';
import { queueManager } from '../../jobs/queue';

// Mock das dependências
jest.mock('../../models/MessageTemplate');
jest.mock('../../jobs/queue');
jest.mock('../../utils/logger');
jest.mock('axios');

describe('Message Processor', () => {
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
    messageProcessor.initialize();
    
    // Assert
    expect(createWorkerSpy).toHaveBeenCalledTimes(1);
    expect(createWorkerSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      expect.any(Number)
    );
  });

  it('should process message correctly', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
        templateId: '456',
        templateVariables: { company: 'Test Company' },
        customer: {
          id: '1',
          name: 'John Doe',
          phone: '5511999999999',
          email: 'john@example.com',
          cpf: '111.111.111-11',
          region: 'Sudeste',
          city: 'São Paulo',
        },
      },
      updateProgress: jest.fn(),
    };
    
    const mockTemplate = {
      id: '456',
      name: 'Test Template',
      body: 'Hello {{1}}, welcome to {{company}}. Your region is {{customer.region}}.',
      whatsapp_template_id: 'template123',
    };
    
    // Mock do método findById do MessageTemplateModel
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(mockTemplate);
    
    // Act
    const result = await messageProcessor.process(mockJob as any);
    
    // Assert
    expect(MessageTemplateModel.prototype.findById).toHaveBeenCalledWith('456');
    expect(mockJob.updateProgress).toHaveBeenCalledTimes(2); // 50% e 100%
    expect(result).toEqual(expect.objectContaining({
      campaignId: '123',
      customerId: '1',
      messageId: expect.any(String),
      status: 'sent',
      sentAt: expect.any(Date),
    }));
  });

  it('should replace template variables correctly', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
        templateId: '456',
        templateVariables: { company: 'Test Company' },
        customer: {
          id: '1',
          name: 'John Doe',
          phone: '5511999999999',
          email: 'john@example.com',
          cpf: '111.111.111-11',
          region: 'Sudeste',
          city: 'São Paulo',
        },
      },
      updateProgress: jest.fn(),
    };
    
    const mockTemplate = {
      id: '456',
      name: 'Test Template',
      body: 'Hello {{1}}, welcome to {{company}}. Your region is {{customer.region}}.',
      whatsapp_template_id: 'template123',
    };
    
    // Mock do método findById do MessageTemplateModel
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(mockTemplate);
    
    // Espionar o método sendWhatsAppMessage
    const sendWhatsAppMessageSpy = jest.spyOn(messageProcessor as any, 'sendWhatsAppMessage');
    
    // Act
    await messageProcessor.process(mockJob as any);
    
    // Assert
    expect(sendWhatsAppMessageSpy).toHaveBeenCalledWith(
      '5511999999999',
      'Hello John Doe, welcome to Test Company. Your region is Sudeste.',
      'template123'
    );
  });

  it('should handle template not found', async () => {
    // Arrange
    const mockJob = {
      data: {
        campaignId: '123',
        templateId: '456',
        templateVariables: { company: 'Test Company' },
        customer: {
          id: '1',
          name: 'John Doe',
          phone: '5511999999999',
        },
      },
      updateProgress: jest.fn(),
    };
    
    // Mock do método findById retornando null
    (MessageTemplateModel.prototype.findById as jest.Mock).mockResolvedValue(null);
    
    // Act & Assert
    await expect(messageProcessor.process(mockJob as any)).rejects.toThrow('Template 456 not found');
  });
});

