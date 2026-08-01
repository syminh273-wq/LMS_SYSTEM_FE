import AbstractRestApiClient from './client';

type UserSettings = Record<string, string>;

interface AvailableVoice {
    id: string;
    name: string;
}

class UserSettingsService extends AbstractRestApiClient {
    constructor() {
        super();
    }

    public async getSettings(): Promise<UserSettings> {
        return this.get('/api/v1/account/user-settings/');
    }

    /**
     * Update settings. 
     * Send an object where each key is the setting name and value is the setting value.
     */
    public async updateSettings(settings: UserSettings): Promise<UserSettings> {
        return this.post('/api/v1/account/user-settings/', { settings });
    }

    public async getAvailableVoices(): Promise<AvailableVoice[]> {
        return this.get('/api/v1/account/user-settings/available-voices/');
    }

    public async previewVoice(voice_name: string, text?: string): Promise<{ url: string, voice_name: string, text: string }> {
        return this.post('/api/v1/account/user-settings/preview/', { voice_name, text });
    }
}

export const userSettingsApi = new UserSettingsService();
