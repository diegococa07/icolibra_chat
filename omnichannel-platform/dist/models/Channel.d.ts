import { Channel, CreateChannel, ChannelType } from '../types';
export declare class ChannelModel {
    static create(channelData: CreateChannel): Promise<Channel>;
    static findById(id: string): Promise<Channel | null>;
    static findByType(type: ChannelType): Promise<Channel | null>;
    static findAll(): Promise<Channel[]>;
    static findActive(): Promise<Channel[]>;
    static update(id: string, updateData: Partial<CreateChannel>): Promise<Channel | null>;
    static toggleActive(id: string, isActive: boolean): Promise<Channel | null>;
    static activateByType(type: ChannelType): Promise<Channel | null>;
    static deactivateByType(type: ChannelType): Promise<Channel | null>;
    static delete(id: string): Promise<boolean>;
    static existsByType(type: ChannelType): Promise<boolean>;
    static countByStatus(): Promise<{
        active: number;
        inactive: number;
    }>;
    static initializeDefaultChannels(): Promise<Channel[]>;
}
//# sourceMappingURL=Channel.d.ts.map