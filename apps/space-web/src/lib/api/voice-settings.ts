import BaseRestApiClient from './client';

export interface VoiceSetting {
    user_id: string;
    user_type: string;
    voice_name: string;
    is_voice_enabled: boolean;
    language: string;
    updated_at: string;
}

export interface AvailableVoice {
    id: string;
    name: string;
}

class VoiceSettingsService extends BaseRestApiClient {
    constructor() {
        super();
    }

    public async getSettings(): Promise<VoiceSetting> {
        return this.get('/api/v1/account/voice-settings/');
    }

    public async updateSettings(data: Partial<VoiceSetting>): Promise<VoiceSetting> {
        return this.patch('/api/v1/account/voice-settings/', data);
    }

    public async getAvailableVoices(): Promise<AvailableVoice[]> {
        return this.get('/api/v1/account/voice-settings/available-voices/');
    }

    public async previewVoice(voice_name: string, text?: string): Promise<{ url: string, voice_name: string, text: string }> {
        return this.post('/api/v1/account/voice-settings/preview/', { voice_name, text });
    }
}

export const voiceSettingsApi = new VoiceSettingsService();
