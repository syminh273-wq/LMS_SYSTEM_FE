import { authApi } from '@/features/auth/api';
import { classroomApi } from '@/features/classroom/api';
import { examApi } from '@/features/exam/api';
import { meetingRoomApi } from '@/features/meeting-room/api';
import { quizApi } from '@/features/quiz/api';
import { quizTasksApi } from '@/features/quiz/api/quiz-tasks';
import { quizCollectionApi, certificateApi } from '@/features/quiz-collection/api';
import { spaceApi as spaceApiInstance } from '@/features/settings/api/space';
import { consumerApi as consumerApiInstance } from '@/features/student/api/consumer';
import { accountService } from '@/features/auth/api/account';
import { userSettingsApi } from '@/features/settings/api/user-settings';
import { notificationApi } from '@/features/notification/api';
import { studentApi } from '@/features/student/api';

export * from '@lms/types';
export * from '@/core/api/exceptions';

export {
  quizApi,
  quizTasksApi,
  quizCollectionApi,
  certificateApi,
  studentApi,
};

export const api = {
  auth: authApi,
  classrooms: classroomApi,
  exams: examApi,
  meetingRooms: meetingRoomApi,
  quizzes: quizApi,
  quizTasks: quizTasksApi,
  quizCollections: quizCollectionApi,
  certificates: certificateApi,
  spaces: spaceApiInstance,
  consumers: consumerApiInstance,
  account: accountService,
  notifications: notificationApi,
};

export {
  authApi,
  classroomApi,
  examApi,
  meetingRoomApi,
  spaceApiInstance as spaceApiClient,
  consumerApiInstance as consumerApiClient,
  accountService,
  notificationApi,
  userSettingsApi,
};

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
  quizCollections: quizCollectionApi,
  certificates: certificateApi,
  sharing: {
    getDownloadQrUrl: (linkUid: string) => `${classroomApi.baseURL}/api/v1/sharing/links/${linkUid}/download_qr/`,
  },
  getSettings: spaceApiInstance.getSettings.bind(spaceApiInstance),
  updateSettings: spaceApiInstance.updateSettings.bind(spaceApiInstance),
};
