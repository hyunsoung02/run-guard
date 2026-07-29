import * as Speech from 'expo-speech';

import type {
  NavigationDistanceStage,
  NavigationManeuver,
  VoiceGuidePriority,
  VoiceGuideRequest,
} from '../types/voiceGuide.types';

export const MIN_SPEECH_INTERVAL_MS =
  3_000;
export const NAVIGATION_GUIDE_MAX_AGE_MS =
  5_000;

const SPEECH_LANGUAGE = 'ko-KR';
const SPEECH_RATE = 0.95;
const SPEECH_PITCH = 1;
const PENDING_RETRY_INTERVAL_MS = 250;

const PRIORITY_RANK:
  Record<VoiceGuidePriority, number> = {
    low: 0,
    normal: 1,
    high: 2,
    critical: 3,
  };

let voiceGuideEnabled = false;
let currentSessionId: string | null =
  null;
let activeRequest:
  | VoiceGuideRequest
  | null = null;
let pendingRequest:
  | VoiceGuideRequest
  | null = null;
let pendingTimer:
  | ReturnType<typeof setTimeout>
  | null = null;
let lastSpeechStartedAtMs =
  Number.NEGATIVE_INFINITY;
let operationVersion = 0;
let stopOperationPromise:
  Promise<void> = Promise.resolve();
let requestOperationPromise:
  Promise<void> = Promise.resolve();

const playedRequestIds =
  new Set<string>();

function isNavigationRequestStale(
  request: VoiceGuideRequest,
  nowMs = Date.now(),
): boolean {
  return (
    request.category ===
      'navigation' &&
    nowMs - request.createdAtMs >
      NAVIGATION_GUIDE_MAX_AGE_MS
  );
}

function clearPendingTimer() {
  if (pendingTimer === null) {
    return;
  }

  clearTimeout(pendingTimer);
  pendingTimer = null;
}

function warnSpeechFailure(
  action: string,
  error: unknown,
) {
  if (!__DEV__) {
    return;
  }

  console.warn(
    `[VOICE-GUIDE] ${action} 실패`,
    error,
  );
}

async function isNativeSpeaking():
  Promise<boolean> {
  try {
    return await Speech
      .isSpeakingAsync();
  } catch (error: unknown) {
    warnSpeechFailure(
      '재생 상태 확인',
      error,
    );
    return activeRequest !== null;
  }
}

function schedulePendingRequest(
  delayMs: number,
) {
  clearPendingTimer();

  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    void drainPendingRequest();
  }, Math.max(delayMs, 0));
}

async function startSpeech(
  request: VoiceGuideRequest,
): Promise<boolean> {
  const requestVersion =
    operationVersion;

  await stopOperationPromise;

  if (
    !voiceGuideEnabled ||
    requestVersion !==
      operationVersion ||
    isNavigationRequestStale(
      request,
    )
  ) {
    return false;
  }

  try {
    activeRequest = request;
    lastSpeechStartedAtMs =
      Date.now();

    Speech.speak(request.message, {
      language: SPEECH_LANGUAGE,
      rate: SPEECH_RATE,
      pitch: SPEECH_PITCH,
      onDone: () => {
        if (
          activeRequest?.id ===
          request.id
        ) {
          activeRequest = null;
        }

        const remainingIntervalMs =
          MIN_SPEECH_INTERVAL_MS -
          (Date.now() -
            lastSpeechStartedAtMs);

        if (pendingRequest) {
          schedulePendingRequest(
            remainingIntervalMs,
          );
        }
      },
      onStopped: () => {
        if (
          activeRequest?.id ===
          request.id
        ) {
          activeRequest = null;
        }
      },
      onError: (error) => {
        if (
          activeRequest?.id ===
          request.id
        ) {
          activeRequest = null;
        }

        warnSpeechFailure(
          '음성 재생',
          error,
        );
      },
    });

    return true;
  } catch (error: unknown) {
    activeRequest = null;
    warnSpeechFailure(
      '음성 재생',
      error,
    );
    return false;
  }
}

async function interruptAndSpeak(
  request: VoiceGuideRequest,
): Promise<boolean> {
  operationVersion += 1;
  const requestVersion =
    operationVersion;

  pendingRequest = null;
  clearPendingTimer();
  activeRequest = null;

  stopOperationPromise =
    Speech.stop().catch(
      (error: unknown) => {
        warnSpeechFailure(
          '음성 중단',
          error,
        );
      },
    );

  await stopOperationPromise;

  if (
    requestVersion !==
    operationVersion
  ) {
    return false;
  }

  return startSpeech(request);
}

function queueLatestRequest(
  request: VoiceGuideRequest,
) {
  if (
    pendingRequest &&
    PRIORITY_RANK[
      pendingRequest.priority
    ] >
      PRIORITY_RANK[
        request.priority
      ]
  ) {
    return;
  }

  pendingRequest = request;

  schedulePendingRequest(
    MIN_SPEECH_INTERVAL_MS -
      (Date.now() -
        lastSpeechStartedAtMs),
  );
}

async function drainPendingRequest() {
  const request = pendingRequest;

  if (
    !request ||
    !voiceGuideEnabled
  ) {
    pendingRequest = null;
    return;
  }

  if (
    isNavigationRequestStale(
      request,
    )
  ) {
    pendingRequest = null;
    return;
  }

  const speaking =
    activeRequest !== null ||
    (await isNativeSpeaking());

  if (speaking) {
    schedulePendingRequest(
      PENDING_RETRY_INTERVAL_MS,
    );
    return;
  }

  const remainingIntervalMs =
    MIN_SPEECH_INTERVAL_MS -
    (Date.now() -
      lastSpeechStartedAtMs);

  if (remainingIntervalMs > 0) {
    schedulePendingRequest(
      remainingIntervalMs,
    );
    return;
  }

  pendingRequest = null;
  await startSpeech(request);
}

export function setVoiceGuideEnabled(
  enabled: boolean,
) {
  voiceGuideEnabled = enabled;

  if (!enabled) {
    void stopVoiceGuide();
  }
}

async function processVoiceGuideRequest(
  request: VoiceGuideRequest,
  sessionIdAtRequest: string | null,
): Promise<boolean> {
  if (
    sessionIdAtRequest !==
      currentSessionId ||
    !voiceGuideEnabled ||
    playedRequestIds.has(
      request.id,
    ) ||
    request.message.trim().length ===
      0 ||
    isNavigationRequestStale(
      request,
    )
  ) {
    return false;
  }

  playedRequestIds.add(request.id);

  const speaking =
    activeRequest !== null ||
    (await isNativeSpeaking());
  const elapsedSinceLastSpeechMs =
    Date.now() -
    lastSpeechStartedAtMs;

  if (
    request.priority ===
      'critical'
  ) {
    return interruptAndSpeak(
      request,
    );
  }

  if (
    request.priority === 'high'
  ) {
    if (
      activeRequest?.priority ===
      'critical'
    ) {
      return false;
    }

    return interruptAndSpeak(
      request,
    );
  }

  if (
    request.priority === 'low' &&
    (speaking ||
      elapsedSinceLastSpeechMs <
        MIN_SPEECH_INTERVAL_MS)
  ) {
    return false;
  }

  if (
    speaking ||
    elapsedSinceLastSpeechMs <
      MIN_SPEECH_INTERVAL_MS
  ) {
    queueLatestRequest(request);
    return true;
  }

  return startSpeech(request);
}

export function speakVoiceGuide(
  request: VoiceGuideRequest,
): Promise<boolean> {
  const sessionIdAtRequest =
    currentSessionId;
  const operation =
    requestOperationPromise.then(
      () =>
        processVoiceGuideRequest(
          request,
          sessionIdAtRequest,
        ),
    );

  requestOperationPromise =
    operation.then(
      () => undefined,
      (error: unknown) => {
        warnSpeechFailure(
          '음성 요청 처리',
          error,
        );
      },
    );

  return operation.catch(
    (error: unknown) => {
      warnSpeechFailure(
        '음성 요청 처리',
        error,
      );
      return false;
    },
  );
}

export async function stopVoiceGuide():
  Promise<void> {
  operationVersion += 1;
  pendingRequest = null;
  activeRequest = null;
  clearPendingTimer();

  stopOperationPromise =
    Speech.stop().catch(
      (error: unknown) => {
        warnSpeechFailure(
          '음성 중단',
          error,
        );
      },
    );

  await stopOperationPromise;
}

export function resetVoiceGuideSession(
  sessionId: string | null = null,
) {
  if (
    sessionId === currentSessionId
  ) {
    return;
  }

  currentSessionId = sessionId;
  playedRequestIds.clear();
  void stopVoiceGuide();
}

export function createNavigationMessage(
  maneuver: NavigationManeuver,
  distanceStage: NavigationDistanceStage,
): string {
  const prefix =
    distanceStage === 'early'
      ? '300미터 앞에서'
      : '잠시 후';

  switch (maneuver) {
    case 'left':
      return `${prefix} 왼쪽으로 이동하세요.`;
    case 'sharp-left':
      return `${prefix} 왼쪽으로 크게 도세요.`;
    case 'right':
      return `${prefix} 오른쪽으로 이동하세요.`;
    case 'sharp-right':
      return `${prefix} 오른쪽으로 크게 도세요.`;
    case 'slight-left':
      return `${prefix} 왼쪽 방향으로 이동하세요.`;
    case 'slight-right':
      return `${prefix} 오른쪽 방향으로 이동하세요.`;
    case 'u-turn':
      return `${prefix} 유턴하세요.`;
    case 'arrive':
      return '목적지에 도착했습니다.';
    case 'straight':
      return distanceStage === 'near'
        ? '경로를 따라 직진하세요.'
        : '300미터 앞까지 경로를 따라 직진하세요.';
    case 'unknown':
      return '경로를 따라 이동하세요.';
  }
}

export function createDistanceMessage(
  kilometer: number,
): string {
  if (kilometer <= 2) {
    return `${kilometer}킬로미터를 달렸습니다.`;
  }

  return `현재까지 ${kilometer}킬로미터를 달렸습니다.`;
}
