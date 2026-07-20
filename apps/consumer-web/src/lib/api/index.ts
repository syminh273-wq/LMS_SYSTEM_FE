import { authApi } from '@/features/auth/api';
import { classroomApi } from '@/features/classroom/api';
import { meetingRoomApi } from '@/features/meeting-room/api';
import { faceApi } from '@/features/face/api';
import { consumerQuizApi } from '@/features/quiz/api';
import { consumerQuizCollectionApi } from '@/features/quiz-collection/api';
import { spaceApi as spaceApiInstance } from '@/features/settings/api/space';
import { consumerApi as consumerApiInstance } from '@/features/student/api/consumer';
import { accountService } from '@/features/auth/api/account';
import { userSettingsApi } from '@/features/settings/api/user-settings';
import { examSessionApi } from '@/features/exam/api/exam-session';
import { ApiException } from '@/core/api/exceptions';
import type { SharingLink, NotificationItem, PaginatedResponse } from '@lms/types';

export * from '@lms/types';
export * from '@/core/api/exceptions';
export { consumerQuizApi };
export { consumerQuizCollectionApi };
export { faceApi };
export { examSessionApi };

export const api = {
  auth: authApi,
  classrooms: classroomApi,
  spaces: spaceApiInstance,
  consumers: consumerApiInstance,
  account: accountService,
};

export {
  authApi,
  classroomApi,
  meetingRoomApi,
  spaceApiInstance as spaceApiClient,
  consumerApiInstance as consumerApiClient,
  accountService,
  userSettingsApi,
};

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

export const sharingApi = {
  resolve: (code: string) => consumerApiInstance.get<SharingLink>(`/api/v1/sharing/links/resolve/?code=${code}`),
};

export const consumerApi = {
  ...consumerApiCompat,
  sharing: sharingApi,
};

export const notificationApi = {
  list: async (): Promise<NotificationItem[]> => {
    const res = await consumerApiInstance.get<PaginatedResponse<NotificationItem> | NotificationItem[]>(
      `/api/v1/notifications/`
    );
    if (Array.isArray(res)) return res;
    return Array.isArray(res?.results) ? res.results : [];
  },
  markRead: async (uid: string): Promise<void> => {
    try {
      await consumerApiInstance.post(`/api/v1/notifications/${uid}/read/`, {});
    } catch (err) {
      if (err instanceof ApiException && err.status === 404) {
        return;
      }
      throw err;
    }
  },
  markAllRead: () => consumerApiInstance.post(`/api/v1/notifications/read-all/`, {}),
};
