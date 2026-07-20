import type { FaceVerifyResponse, FaceClassroomVerifyResponse } from '../types';

export function getFaceStatusColor(recognized: boolean): string {
  return recognized
    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
    : 'bg-red-50 text-red-600 border-red-100';
}

export function getFaceStatusText(recognized: boolean, t: (key: string) => string): string {
  return recognized ? t('face.status.recognized') : t('face.status.not_recognized');
}

export function getSimilarityColor(similarity: number): string {
  if (similarity >= 0.9) return 'text-emerald-600';
  if (similarity >= 0.7) return 'text-amber-600';
  return 'text-red-600';
}

export function formatSimilarity(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

export function isFaceVerified(response: FaceVerifyResponse): boolean {
  return response.recognized && !response.error;
}

export function isClassroomFaceVerified(response: FaceClassroomVerifyResponse): boolean {
  return response.is_verified && !response.error;
}

export function getFaceErrorText(error: string | undefined, t: (key: string) => string): string {
  if (!error) return '';
  
  switch (error) {
    case 'no_face':
      return t('face.error.no_face');
    case 'multiple_faces':
      return t('face.error.multiple_faces');
    case 'low_similarity':
      return t('face.error.low_similarity');
    case 'camera_not_available':
      return t('face.error.camera_not_available');
    default:
      return error;
  }
}

export function getCameraPermissionText(
  permission: PermissionState | undefined,
  t: (key: string) => string
): string {
  switch (permission) {
    case 'granted':
      return t('face.camera.granted');
    case 'denied':
      return t('face.camera.denied');
    case 'prompt':
      return t('face.camera.prompt');
    default:
      return t('face.camera.unknown');
  }
}

export function formatEnrolledDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
