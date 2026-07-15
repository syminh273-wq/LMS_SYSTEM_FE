import type { LocaleBundles } from '@shared/components/LocaleProvider';

import commonEn from '@/locales/common/en.json';
import commonVi from '@/locales/common/vi.json';
import authEn from '@/locales/auth/en.json';
import authVi from '@/locales/auth/vi.json';
import calendarEn from '@/locales/calendar/en.json';
import calendarVi from '@/locales/calendar/vi.json';
import classroomEn from '@/locales/classroom/en.json';
import classroomVi from '@/locales/classroom/vi.json';
import dashboardEn from '@/locales/dashboard/en.json';
import dashboardVi from '@/locales/dashboard/vi.json';
import examEn from '@/locales/exam/en.json';
import examVi from '@/locales/exam/vi.json';
import feedEn from '@/locales/feed/en.json';
import feedVi from '@/locales/feed/vi.json';
import gradesEn from '@/locales/grades/en.json';
import gradesVi from '@/locales/grades/vi.json';
import joinEn from '@/locales/join/en.json';
import joinVi from '@/locales/join/vi.json';
import quizEn from '@/locales/quiz/en.json';
import quizVi from '@/locales/quiz/vi.json';
import validationEn from '@/locales/validation/en.json';
import validationVi from '@/locales/validation/vi.json';

import sharedLayoutEn from '@shared/locales/layout/en.json';
import sharedLayoutVi from '@shared/locales/layout/vi.json';
import sharedSettingsEn from '@shared/locales/settings/en.json';
import sharedSettingsVi from '@shared/locales/settings/vi.json';
import sharedProfileEn from '@shared/locales/profile/en.json';
import sharedProfileVi from '@shared/locales/profile/vi.json';
import sharedEditorEn from '@shared/locales/editor/en.json';
import sharedEditorVi from '@shared/locales/editor/vi.json';
import sharedFaceEn from '@shared/locales/face/en.json';
import sharedFaceVi from '@shared/locales/face/vi.json';
import sharedRtcEn from '@shared/locales/rtc/en.json';
import sharedRtcVi from '@shared/locales/rtc/vi.json';
import sharedResourceEn from '@shared/locales/resource/en.json';
import sharedResourceVi from '@shared/locales/resource/vi.json';

export const consumerWebBundles: LocaleBundles = {
  en: {
    common: commonEn,
    auth: authEn,
    calendar: calendarEn,
    classroom: classroomEn,
    dashboard: dashboardEn,
    exam: examEn,
    feed: feedEn,
    grades: gradesEn,
    join: joinEn,
    quiz: quizEn,
    validation: validationEn,
    layout: sharedLayoutEn,
    settings: sharedSettingsEn,
    profile: sharedProfileEn,
    editor: sharedEditorEn,
    face: sharedFaceEn,
    rtc: sharedRtcEn,
    resource: sharedResourceEn,
  },
  vi: {
    common: commonVi,
    auth: authVi,
    calendar: calendarVi,
    classroom: classroomVi,
    dashboard: dashboardVi,
    exam: examVi,
    feed: feedVi,
    grades: gradesVi,
    join: joinVi,
    quiz: quizVi,
    validation: validationVi,
    layout: sharedLayoutVi,
    settings: sharedSettingsVi,
    profile: sharedProfileVi,
    editor: sharedEditorVi,
    face: sharedFaceVi,
    rtc: sharedRtcVi,
    resource: sharedResourceVi,
  },
};
