import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketBaseUrl } from '@/lib/api/runtime-url';
import { meetingRoomApi } from '@/lib/api/meeting-room';

interface RTCMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export type RtcMediaSource = 'screen' | 'camera';

const PC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export function useRTC(initialRoomUid: string | null) {
  const [roomUid, setRoomUid] = useState<string | null>(initialRoomUid);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localSource, setLocalSource] = useState<RtcMediaSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const isSettingRemoteAnswerPendingRef = useRef(false);

  const sendSignaling = useCallback((payload: object) => {
    const ws = wsRef.current;
    if (!ws) return;
    const data = JSON.stringify(payload);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    } else {
      const sendOnOpen = () => {
        ws.send(data);
        ws.removeEventListener('open', sendOnOpen);
      };
      ws.addEventListener('open', sendOnOpen, { once: true });
    }
  }, []);

  const setupPeerConnection = useCallback((pc: RTCPeerConnection) => {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignaling({ type: 'ice-candidate', candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        setRemoteStream(stream);
      } else if (event.track) {
        setRemoteStream((prev) => {
          if (prev) {
            prev.addTrack(event.track);
            return prev;
          }
          return new MediaStream([event.track]);
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      setIsConnected(
        pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed',
      );
      if (pc.iceConnectionState === 'failed') {
        setError('ICE connection failed (check network/NAT)');
        void pc.restartIce();
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setIsConnected(false);
      }
    };
  }, [sendSignaling]);

  const ensurePeerConnection = useCallback((): RTCPeerConnection => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      return pcRef.current;
    }
    const pc = new RTCPeerConnection(PC_CONFIG);
    setupPeerConnection(pc);
    pcRef.current = pc;
    return pc;
  }, [setupPeerConnection]);

  const createOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    if (pc.signalingState !== 'stable' || makingOfferRef.current) return;
    try {
      makingOfferRef.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignaling({ type: 'offer', offer });
    } catch (err) {
      console.error('[useRTC] createOffer error:', err);
    } finally {
      makingOfferRef.current = false;
    }
  }, [sendSignaling]);

  const handleSignaling = useCallback(async (data: RTCMessage) => {
    if (!data || !data.type) return;
    const pc = ensurePeerConnection();
    try {
      if (data.type === 'offer' && data.offer) {
        const offerCollision =
          makingOfferRef.current ||
          (pc.signalingState !== 'stable' && !isSettingRemoteAnswerPendingRef.current);
        if (offerCollision) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setLocalDescription({ type: 'rollback' });
          } else {
            return;
          }
        }
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        await pc.setLocalDescription();
        const answer = pc.localDescription;
        if (answer) {
          sendSignaling({ type: 'answer', answer });
        }
      } else if (data.type === 'answer' && data.answer) {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      } else if (data.type === 'ice-candidate' && data.candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.warn('[useRTC] addIceCandidate error (ignored):', err);
        }
      }
    } catch (err) {
      console.error('[useRTC] signaling error:', err);
      setError(err instanceof Error ? err.message : 'Signaling failed');
    }
  }, [ensurePeerConnection, sendSignaling]);

  useEffect(() => {
    if (!roomUid || !isJoined) return;
    const handler = (event: Event) => {
      if (!localStreamRef.current) return;
      if (!pcRef.current) return;
      void createOffer();
    };
    window.addEventListener('rtc:peer-joined', handler);
    return () => window.removeEventListener('rtc:peer-joined', handler);
  }, [roomUid, isJoined, createOffer]);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setLocalSource(null);
  }, []);

  const leave = useCallback(async () => {
    const currentRoom = roomUid;
    stopLocalStream();
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRemoteStream(null);
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

    const onWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'peer-joined') {
          window.dispatchEvent(new CustomEvent('rtc:peer-joined', { detail: data.peer }));
          return;
        }
        if (data?.type === 'peer-left') {
          window.dispatchEvent(new CustomEvent('rtc:peer-left', { detail: data.peer }));
          return;
        }
        void handleSignaling(data as RTCMessage);
      } catch (err) {
        console.error('[useRTC] WS message error:', err);
      }
    };

    ws.onmessage = onWsMessage;
    ws.onerror = () => setError('WebSocket connection error');

    return () => {
      ws.close();
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
    };
  }, [roomUid, isJoined, handleSignaling]);

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
      const existingStream = localStreamRef.current;
      const sameSource =
        existingStream &&
        ((source === 'screen' && existingStream.getVideoTracks()[0]?.getSettings().displaySurface) ||
          (source === 'camera' && !existingStream.getVideoTracks()[0]?.getSettings().displaySurface));

      if (existingStream && sameSource) {
        const pc = ensurePeerConnection();
        const hasTrack = pc.getSenders().some((s) => s.track && existingStream.getTracks().includes(s.track));
        if (!hasTrack) {
          existingStream.getTracks().forEach((track) => pc.addTrack(track, existingStream));
        }
        return;
      }

      stopLocalStream();

      const stream = source === 'screen'
        ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setLocalSource(source);
      stream.getVideoTracks()[0]?.addEventListener('ended', stopLocalStream, { once: true });

      const pc = ensurePeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      void createOffer();
    } catch (err) {
      console.error('[useRTC] startMediaShare error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start media share');
      throw err;
    }
  }, [createOffer, ensurePeerConnection, stopLocalStream]);

  const renegotiate = useCallback(() => {
    const pc = pcRef.current;
    if (!pc) return;
    if (pc.signalingState === 'stable' && !makingOfferRef.current) {
      void pc.setLocalDescription().then(() => {
        const offer = pc.localDescription;
        if (offer) {
          sendSignaling({ type: 'offer', offer });
        }
      }).catch((err) => {
        console.error('[useRTC] renegotiate error:', err);
      });
    }
  }, [sendSignaling]);

  const stopMediaShare = useCallback(() => {
    stopLocalStream();
    const pc = pcRef.current;
    if (pc) {
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          try { sender.track.stop(); } catch {}
          try { pc.removeTrack(sender); } catch {}
        }
      });
    }
    setIsConnected(false);
  }, [stopLocalStream]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) {
      void startMediaShare('camera').catch(() => {});
      return;
    }
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;
    if (videoTrack.enabled) {
      videoTrack.enabled = false;
      setLocalStream(new MediaStream(stream.getTracks()));
    } else {
      videoTrack.enabled = true;
      setLocalStream(new MediaStream(stream.getTracks()));
    }
  }, [startMediaShare]);

  const startScreenShare = useCallback(() => startMediaShare('screen'), [startMediaShare]);
  const startCameraShare = useCallback(() => startMediaShare('camera'), [startMediaShare]);
  const stopScreenShare = useCallback(() => stopMediaShare(), [stopMediaShare]);

  return {
    roomUid,
    setRoomUid,
    localStream,
    remoteStream,
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
    renegotiate,
    createOffer,
    toggleCamera,
  };
}
