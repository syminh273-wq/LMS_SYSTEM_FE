import { authApi } from './auth';
import { classroomApi } from './classroom';
import { consumerQuizApi } from './quiz';
import { spaceApi as spaceApiInstance } from './space';
import { consumerApi as consumerApiInstance } from './consumer';
import { examSessionApi } from './exam-session';
import { consumerCalendarApi } from './calendar';
import { consumerDashboardApi } from './dashboard';
import { consumerLeaveRequestApi } from './leaveRequest';
import { paymentApi } from './payment';
import { historyApi } from './history';
import { ApiException } from './exceptions';
import { SharingLink, NotificationItem, PaginatedResponse } from './types';
import { consumerCourseApi } from './course';

export * from './types';
export * from './exceptions';
export * from './calendar';
export * from './leaveRequest';
export * from './payment';
export { consumerQuizApi };
export { examSessionApi };
export { consumerCalendarApi };
export { consumerDashboardApi };
export { consumerLeaveRequestApi };
export { consumerCourseApi };
export { paymentApi };
export { historyApi };
export { classroomApi };

// Backward compatibility exports for the previous structure
const consumerApiCompat = {
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

// Sharing logic
const sharingApi = {
  resolve: (code: string) => consumerApiInstance.get<SharingLink>(`/api/v1/sharing/links/resolve/?code=${code}`),
};

export const consumerApi = {
  ...consumerApiCompat,
  sharing: sharingApi,
  calendar: consumerCalendarApi,
  dashboard: consumerDashboardApi,
  leaveRequests: consumerLeaveRequestApi,
  courses: consumerCourseApi,
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
      // 404 is expected for notifications that exist only in the realtime feed
      // (e.g. pushed via Firebase but not persisted to the backend yet). The
      // caller has already updated local state — do not surface this as a
      // failure that triggers a revert.
      if (err instanceof ApiException && err.status === 404) {
        return;
      }
      throw err;
    }
  },
  markAllRead: () => consumerApiInstance.post(`/api/v1/notifications/read-all/`, {}),
};
