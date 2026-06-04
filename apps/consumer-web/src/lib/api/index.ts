import { authApi } from './auth';
import { classroomApi } from './classroom';
import { meetingRoomApi } from './meeting-room';
import { faceApi } from './face';
import { consumerQuizApi } from './quiz';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { accountService } from './account';
import { voiceSettingsApi } from './voice-settings';
import { examSessionApi } from './exam-session';
import { SharingLink } from './types';

export * from './types';
export * from './exceptions';
export { consumerQuizApi };
export { faceApi };
export { examSessionApi };

// For backward compatibility and centralized access
export const api = {
  auth: authApi,
  classrooms: classroomApi,
  spaces: spaceApiInstance,
  consumers: consumerApiInstance,
  account: accountService,
};

// Re-export specific instances
export { authApi, classroomApi, meetingRoomApi, spaceApiInstance as spaceApiClient, consumerApiInstance as consumerApiClient, accountService, voiceSettingsApi };

// Backward compatibility exports for the previous structure
export const consumerApiCompat = {
  auth: {
    login: authApi.consumerLogin.bind(authApi),
    register: authApi.consumerRegister.bind(authApi),
  },
  consumers: consumerApiInstance,
  spaces: spaceApiInstance,
  classrooms: {
    mine: classroomApi.mine.bind(classroomApi),
  }
};

export const spaceApi = {
  auth: {
    login: authApi.spaceLogin.bind(authApi),
    register: authApi.spaceRegister.bind(authApi),
  },
  classrooms: classroomApi,
};

// Sharing logic
export const sharingApi = {
  resolve: (code: string) => consumerApiInstance.get<SharingLink>(`/api/v1/sharing/links/resolve/?code=${code}`),
};

export const consumerApi = {
  ...consumerApiCompat,
  sharing: sharingApi,
};
