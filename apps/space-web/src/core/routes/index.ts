const routeSpace = {
  dashboard: '/space',
  classrooms: '/space/classrooms',
  classroomCreate: '/space/classrooms/create',
  classroomEdit: (uid: string) => `/space/classrooms/edit/${uid}`,
  classroomDetails: (uid: string) => `/space/classrooms/${uid}/details`,
  quizzes: '/space/quizzes',
  quizCollections: '/space/quiz-collections',
  admin: '/space/admin',
  settings: '/space/settings',
  student: '/space/student',
  login: '/space/login',
  register: '/space/register',
  forgotPassword: '/space/forgot-password',
  verifyOtp: '/space/verify-otp',
  resetPassword: '/space/reset-password',
};

export default routeSpace;
