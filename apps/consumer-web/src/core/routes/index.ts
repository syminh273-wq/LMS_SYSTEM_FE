const routeConsumer = {
  dashboard: '/',
  classrooms: '/classrooms',
  classroomDetails: (uid: string) => `/classrooms/${uid}`,
  quizzes: '/quizzes',
  quizCollections: '/quiz-collections',
  settings: '/settings',
  profile: '/profile',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyOtp: '/verify-otp',
  resetPassword: '/reset-password',
};

export default routeConsumer;
