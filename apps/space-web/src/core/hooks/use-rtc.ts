'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';

interface RTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export type RtcMediaSource = 'screen' | 'camera';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useRTC(roomUid: string | null) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localSource, setLocalSource] = useState<RtcMediaSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    pcRef.current?.close();
    pcRef.current = null;

    wsRef.current?.close();
    wsRef.current = null;

    setRemoteStream(null);
    setLocalSource(null);
    setIsConnected(false);
  }, []);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setLocalSource(null);
  }, []);

  const stopMediaShare = useCallback(() => {
    stopLocalStream();
    pcRef.current?.close();
    pcRef.current = null;
    setIsConnected(false);
  }, [stopLocalStream]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
        }));
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pc.onconnectionstatechange = () => {
      setIsConnected(pc.connectionState === 'connected');
    };

    pcRef.current = pc;
    return pc;
  }, []);

  const handleSignaling = useCallback(async (data: RTCMessage) => {
    if (!pcRef.current) createPeerConnection();
    const pc = pcRef.current;

    if (!pc) return;

    try {
      if (data.type === 'offer' && data.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        wsRef.current?.send(JSON.stringify({ type: 'answer', answer }));
      } else if (data.type === 'answer' && data.answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      } else if (data.type === 'ice-candidate' && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    } catch (err) {
      console.error('Signaling error:', err);
    }
  }, [createPeerConnection]);

  useEffect(() => {
    if (!roomUid) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    const wsBase = getWebSocketBaseUrl();
    const ws = new WebSocket(`${wsBase}/ws/rtc/${roomUid}/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        void handleSignaling(JSON.parse(event.data));
      } catch (err) {
        console.error('WS message error:', err);
      }
    };

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [handleSignaling, roomUid]);

  const startMediaShare = useCallback(async (source: RtcMediaSource) => {
    stopLocalStream();
    pcRef.current?.close();
    pcRef.current = null;

    const stream = source === 'screen'
      ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    localStreamRef.current = stream;
    setLocalStream(stream);
    setLocalSource(source);
    stream.getVideoTracks()[0]?.addEventListener('ended', stopLocalStream, { once: true });

    const pc = pcRef.current || createPeerConnection();
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    wsRef.current?.send(JSON.stringify({ type: 'offer', offer }));
  }, [createPeerConnection, stopLocalStream]);

  const startScreenShare = useCallback(() => startMediaShare('screen'), [startMediaShare]);
  const startCameraShare = useCallback(() => startMediaShare('camera'), [startMediaShare]);

  const stopScreenShare = useCallback(() => {
    cleanup();
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    localSource,
    isConnected,
    startMediaShare,
    startScreenShare,
    startCameraShare,
    stopMediaShare,
    stopScreenShare,
  };
}
