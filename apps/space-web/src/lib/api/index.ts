import { authApi } from './auth';
import { classroomApi } from './classroom';
import { examApi } from './exam';
import { assignmentApi } from './assignment';
import { meetingRoomApi } from './meeting-room';
import { quizApi } from './quiz';
import { quizCollectionApi, certificateApi } from './quiz-collection';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { userSettingsApi } from './user-settings';
import { calendarApi } from './calendar';
import { spaceLeaveRequestApi } from './leaveRequest';
import { courseApi } from './course';
import { dashboardApi } from './dashboard';

export * from './types';
export * from './exceptions';
export * from './calendar';
export * from './leaveRequest';
export { quizApi, calendarApi, spaceLeaveRequestApi, courseApi, classroomApi, examApi, assignmentApi };

// Re-export specific instances
export { userSettingsApi };

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
  assignments: assignmentApi,
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
  dashboard: dashboardApi,
};
