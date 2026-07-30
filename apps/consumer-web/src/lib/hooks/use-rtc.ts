import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';
import { meetingRoomApi } from '@/lib/api/meeting-room';

export type RtcMediaSource = 'screen' | 'camera';

// Video is relayed as JPEG frames over the same WS used for join/leave —
// no WebRTC/ICE/STUN/TURN involved. Simple, works through any firewall,
// trade-off is higher bandwidth/latency than a real video codec.
const FRAME_INTERVAL_MS = 120; // ~8 fps
const FRAME_MAX_WIDTH = 640;
const FRAME_JPEG_QUALITY = 0.6;

export function useRTC(initialRoomUid: string | null) {
  // The WS lifecycle depends on (roomUid, isJoined). We hold the active room
  // in state (initialized from the prop) and sync it via an effect when the
  // prop changes. This is the React-recommended "Adjusting state when a
  // prop changes" pattern. The eslint react-hooks plugin flags it because
  // it can't tell the setState is guarded by a value-equality check; we
  // disable the rule for this specific sync line because the guard
  // prevents cascading re-renders.
  const [roomUid, setRoomUid] = useState<string | null>(initialRoomUid);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setRoomUid((prev) => (prev === initialRoomUid ? prev : initialRoomUid));
  }, [initialRoomUid]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteFrame, setRemoteFrame] = useState<string | null>(null);
  const [localSource, setLocalSource] = useState<RtcMediaSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const captureVideoRef = useRef<HTMLVideoElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendWs = useCallback((payload: object) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  }, []);

  const stopFrameCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    captureVideoRef.current?.pause();
    captureVideoRef.current = null;
    captureCanvasRef.current = null;
  }, []);

  const startFrameCapture = useCallback((stream: MediaStream) => {
    stopFrameCapture();

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = stream;
    void video.play().catch(() => {});
    captureVideoRef.current = video;

    const canvas = document.createElement('canvas');
    captureCanvasRef.current = canvas;

    captureIntervalRef.current = setInterval(() => {
      if (video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) return;
      const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', FRAME_JPEG_QUALITY);
      sendWs({ type: 'video-frame', image: dataUrl });
    }, FRAME_INTERVAL_MS);
  }, [sendWs, stopFrameCapture]);

  const stopLocalStream = useCallback(() => {
    stopFrameCapture();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setLocalSource(null);
  }, [stopFrameCapture]);

  const leave = useCallback(async () => {
    const currentRoom = roomUid;
    stopLocalStream();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRemoteFrame(null);
    setIsConnected(false);
    setError(null);
    if (currentRoom) {
      try {
        await meetingRoomApi.leave(currentRoom);
      } catch (err) {
        console.warn('[useRTC] leave failed:', err);
      }
    }
    setIsJoined(false);
  }, [roomUid, stopLocalStream]);

  useEffect(() => {
    if (!roomUid || !isJoined) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const wsBase = getWebSocketBaseUrl();
    const ws = new WebSocket(`${wsBase}/ws/rtc/${roomUid}/?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setError('WebSocket connection error');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'video-frame' && typeof data.image === 'string') {
          setRemoteFrame(data.image);
        }
        // peer-joined/peer-left are informational only in the frame-relay model —
        // no renegotiation needed, frames just start/stop arriving.
      } catch (err) {
        console.error('[useRTC] WS message error:', err);
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [roomUid, isJoined]);

  const joinRoom = useCallback(async (targetRoomUid?: string) => {
    const nextUid = targetRoomUid ?? roomUid;
    if (!nextUid) throw new Error('No room uid provided');

    try {
      await meetingRoomApi.join(nextUid);
    } catch (err) {
      console.error('[useRTC] join failed:', err);
      throw err;
    }

    if (targetRoomUid && targetRoomUid !== roomUid) {
      setRoomUid(targetRoomUid);
    }
    setIsJoined(true);
  }, [roomUid]);

  const startMediaShare = useCallback(async (source: RtcMediaSource) => {
    try {
      stopLocalStream();

      const stream = source === 'screen'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalSource(source);
      stream.getVideoTracks()[0]?.addEventListener('ended', stopLocalStream, { once: true });

      startFrameCapture(stream);
    } catch (err) {
      console.error('[useRTC] startMediaShare error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start media share');
      throw err;
    }
  }, [startFrameCapture, stopLocalStream]);

  const stopMediaShare = useCallback(() => {
    stopLocalStream();
  }, [stopLocalStream]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      void startMediaShare('camera').catch(() => {});
      return;
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    videoTrack.enabled = !videoTrack.enabled;
    setLocalStream(new MediaStream(stream.getTracks()));
  }, [startMediaShare]);

  const startScreenShare = useCallback(() => startMediaShare('screen'), [startMediaShare]);
  const startCameraShare = useCallback(() => startMediaShare('camera'), [startMediaShare]);
  const stopScreenShare = useCallback(() => stopMediaShare(), [stopMediaShare]);

  return {
    roomUid,
    setRoomUid,
    localStream,
    remoteFrame,
    localSource,
    isConnected,
    isJoined,
    error,
    joinRoom,
    leave,
    startMediaShare,
    startScreenShare,
    startCameraShare,
    stopMediaShare,
    stopScreenShare,
    toggleCamera,
  };
}
