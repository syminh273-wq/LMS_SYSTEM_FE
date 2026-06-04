import { authApi } from './auth';
import { classroomApi } from './classroom';
import { examApi } from './exam';
import { meetingRoomApi } from './meeting-room';
import { quizApi } from './quiz';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { accountService } from './account';
import { voiceSettingsApi } from './voice-settings';
import { notificationApi } from './notification';
import { studentApi } from './student';

export * from './types';
export * from './exceptions';
export { quizApi, studentApi };

// For backward compatibility and centralized access
export const api = {
  auth: authApi,
  classrooms: classroomApi,
  exams: examApi,
  meetingRooms: meetingRoomApi,
  quizzes: quizApi,
  spaces: spaceApiInstance,
  consumers: consumerApiInstance,
  account: accountService,
  notifications: notificationApi,
};

// Re-export specific instances
export { authApi, classroomApi, examApi, meetingRoomApi, spaceApiInstance as spaceApiClient, consumerApiInstance as consumerApiClient, accountService, notificationApi, voiceSettingsApi };

// Backward compatibility exports for the previous structure
export const consumerApi = {
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
  exams: examApi,
  meetingRooms: meetingRoomApi,
  quizzes: quizApi,
  sharing: {
    getDownloadQrUrl: (linkUid: string) => `${classroomApi.baseURL}/api/v1/sharing/links/${linkUid}/download_qr/`,
  },
  getSettings: spaceApiInstance.getSettings.bind(spaceApiInstance),
  updateSettings: spaceApiInstance.updateSettings.bind(spaceApiInstance),
};
