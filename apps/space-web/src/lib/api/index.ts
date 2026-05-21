import { authApi } from './auth';
import { classroomApi } from './classroom';
import { examApi } from './exam';
import { quizApi } from './quiz';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { accountService } from './account';

export * from './types';
export * from './exceptions';
export { quizApi };

// For backward compatibility and centralized access
export const api = {
  auth: authApi,
  classrooms: classroomApi,
  exams: examApi,
  quizzes: quizApi,
  spaces: spaceApiInstance,
  consumers: consumerApiInstance,
  account: accountService,
};

// Re-export specific instances
export { authApi, classroomApi, examApi, spaceApiInstance as spaceApiClient, consumerApiInstance as consumerApiClient, accountService };

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
  quizzes: quizApi,
  sharing: {
    getDownloadQrUrl: (linkUid: string) => `${classroomApi.baseURL}/api/v1/sharing/links/${linkUid}/download_qr/`,
  }
};
