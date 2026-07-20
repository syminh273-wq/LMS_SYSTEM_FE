import { authApi } from './auth';
import { classroomApi } from './classroom';
import { examApi } from './exam';
import { meetingRoomApi } from './meeting-room';
import { quizApi } from './quiz';
import { quizTasksApi } from './quiz-tasks';
import { quizCollectionApi, certificateApi } from './quiz-collection';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { accountService } from './account';
import { userSettingsApi } from './user-settings';
import { notificationApi } from './notification';
import { studentApi } from './student';
import { calendarApi } from './calendar';
import { spaceLeaveRequestApi } from './leaveRequest';
import { courseApi } from './course';

export * from './types';
export * from './exceptions';
export * from './calendar';
export * from './leaveRequest';
export { quizApi, quizTasksApi, quizCollectionApi, certificateApi, studentApi, calendarApi, spaceLeaveRequestApi, courseApi };

// For backward compatibility and centralized access
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
  calendar: calendarApi,
  leaveRequests: spaceLeaveRequestApi,
  courses: courseApi,
};

// Re-export specific instances
export { authApi, classroomApi, examApi, meetingRoomApi, spaceApiInstance as spaceApiClient, consumerApiInstance as consumerApiClient, accountService, notificationApi, userSettingsApi };

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
  quizCollections: quizCollectionApi,
  certificates: certificateApi,
  calendar: calendarApi,
  leaveRequests: spaceLeaveRequestApi,
  courses: courseApi,
  sharing: {
    getDownloadQrUrl: (linkUid: string) => `${classroomApi.baseURL}/api/v1/sharing/links/${linkUid}/download_qr/`,
  },
  getSettings: spaceApiInstance.getSettings.bind(spaceApiInstance),
  updateSettings: spaceApiInstance.updateSettings.bind(spaceApiInstance),
};
