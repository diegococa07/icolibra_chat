import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { campaignScheduler } from '../../jobs/campaignScheduler';
import { CampaignModel } from '../../models/Campaign';
import { queueManager } from '../../jobs/queue';
import { CampaignStatus } from '../../types';

// Mock das dependências
jest.mock('../../models/Campaign');
jest.mock('../../jobs/queue');
jest.mock('../../utils/logger');

describe('Campaign Scheduler', () => {
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
    const createSchedulerSpy = jest.spyOn(queueManager, 'createScheduler');
    
    // Act
    campaignScheduler.initialize();
    
    // Assert
    expect(createSchedulerSpy).toHaveBeenCalledTimes(1);
    expect(createSchedulerSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      expect.any(String)
    );
  });

  it('should process scheduled campaigns', async () => {
    // Arrange
    const mockCampaigns = [
      { id: '1', name: 'Test Campaign 1' },
      { id: '2', name: 'Test Campaign 2' }
    ];
    
    // Mock do método findScheduledInPast
    (CampaignModel.prototype.findScheduledInPast as jest.Mock).mockResolvedValue(mockCampaigns);
    
    // Mock do método updateStatus
    (CampaignModel.prototype.updateStatus as jest.Mock).mockResolvedValue(true);
    
    // Mock da função addCampaignSenderJob
    const addJobSpy = jest.spyOn(queueManager, 'addJob');
    
    // Act
    await campaignScheduler.process();
    
    // Assert
    expect(CampaignModel.prototype.findScheduledInPast).toHaveBeenCalledTimes(1);
    expect(CampaignModel.prototype.updateStatus).toHaveBeenCalledTimes(2);
    expect(CampaignModel.prototype.updateStatus).toHaveBeenCalledWith('1', CampaignStatus.SENDING);
    expect(CampaignModel.prototype.updateStatus).toHaveBeenCalledWith('2', CampaignStatus.SENDING);
    expect(addJobSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle empty campaign list', async () => {
    // Arrange
    (CampaignModel.prototype.findScheduledInPast as jest.Mock).mockResolvedValue([]);
    const addJobSpy = jest.spyOn(queueManager, 'addJob');
    
    // Act
    await campaignScheduler.process();
    
    // Assert
    expect(CampaignModel.prototype.findScheduledInPast).toHaveBeenCalledTimes(1);
    expect(CampaignModel.prototype.updateStatus).not.toHaveBeenCalled();
    expect(addJobSpy).not.toHaveBeenCalled();
  });

  it('should handle errors during processing', async () => {
    // Arrange
    const mockError = new Error('Test error');
    (CampaignModel.prototype.findScheduledInPast as jest.Mock).mockRejectedValue(mockError);
    
    // Act & Assert
    await expect(campaignScheduler.process()).rejects.toThrow('Test error');
  });
});

