import { useState, useCallback } from 'react';
import type { FaceVerifyResponse, FaceEnrollResponse, FaceEnrollStatusResponse } from '../types';
import { faceApi } from '../api';

export function useFaceVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verify = useCallback(async (imageData: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await faceApi.verifyGeneral(imageData);
      return res as FaceVerifyResponse;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verify,
    loading,
    error,
  };
}

export function useFaceClassroomVerify() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const verifyClassroom = useCallback(async (classroomUid: string, imageData: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await faceApi.verifyClassroom(classroomUid, imageData);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verifyClassroom,
    loading,
    error,
  };
}

export function useFaceEnroll() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const enroll = useCallback(async (imageData: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await faceApi.enroll(imageData);
      return res as FaceEnrollResponse;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enroll,
    loading,
    error,
  };
}

export function useFaceEnrollStatus() {
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await faceApi.getEnrollStatus();
      setEnrolled((res as FaceEnrollStatusResponse).enrolled);
      return res;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    enrolled,
    loading,
    error,
    checkStatus,
  };
}

export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });
      setStream(mediaStream);
      return mediaStream;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  return {
    stream,
    error,
    startCamera,
    stopCamera,
  };
}
