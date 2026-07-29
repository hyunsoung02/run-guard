/**
 * 공공데이터포털 한국도로교통공단 보행노인 교통사고 다발지역 API
 *
 * Endpoint:
 * https://apis.data.go.kr/B552061/frequentzoneOldman/getRestFrequentzoneOldman
 */

const OLDMAN_ACCIDENT_API_URL =
  'https://apis.data.go.kr/B552061/frequentzoneOldman/getRestFrequentzoneOldman';

const DEFAULT_TIMEOUT_MS = 4_000;
const SUCCESS_RESULT_CODES =
  new Set([
    '0000',
    '00',
  ]);
const DEFAULT_NUM_OF_ROWS = '100';
const DEFAULT_PAGE_NO = '1';

const KOREA_LONGITUDE_RANGE = {
  min: 124,
  max: 132,
} as const;

const KOREA_LATITUDE_RANGE = {
  min: 32.5,
  max: 39.5,
} as const;

/**
 * 앱 내부에서 공통으로 사용하는 좌표 형식.
 *
 * MapLibre와 GeoJSON의 좌표 순서에 맞춰
 * [경도, 위도] 순서로 저장한다.
 */
export type MapCoordinate = readonly [
  longitude: number,
  latitude: number,
];

export type OldmanAccidentRequest = {
  /**
   * 조회 연도.
   *
   * API 코드표에 있는 값을 사용한다.
   * 예: '2024'
   */
  searchYearCd: string;

  /**
   * 법정동 시도 코드.
   * 예: 경기도 '41'
   */
  siDo: string;

  /**
   * 법정동 시군구 코드.
   * 코드표의 시군구 값을 사용한다.
   */
  guGun: string;

  /**
   * 요청 제한 시간.
   * 생략하면 4초를 사용한다.
   */
  timeoutMs?: number;

  /**
   * 화면 이탈 등 외부 요청 취소 신호.
   */
  signal?: AbortSignal;
};

/**
 * API 원본 항목.
 *
 * 실제 응답의 필드명이 변경되거나 일부 필드가 빠져도
 * 앱이 즉시 중단되지 않도록 선택 속성과 인덱스 시그니처를 사용한다.
 */
export type OldmanAccidentApiItem = {
  afos_fid?: string | number;
  afos_id?: string | number;

  spot_nm?: string;
  afos_nm?: string;

  occrrnc_cnt?: string | number;
  accident_count?: string | number;

  caslt_cnt?: string | number;
  casualty_count?: string | number;

  dth_dnv_cnt?: string | number;
  death_count?: string | number;

  se_dnv_cnt?: string | number;
  serious_injury_count?: string | number;

  sl_dnv_cnt?: string | number;
  minor_injury_count?: string | number;

  wnd_dnv_cnt?: string | number;
  wounded_count?: string | number;

  lo_crd?: string | number;
  longitude?: string | number;
  x_crd?: string | number;

  la_crd?: string | number;
  latitude?: string | number;
  y_crd?: string | number;

  sido_sgg_nm?: string;
  sido_nm?: string;
  sigungu_nm?: string;

  [key: string]: unknown;
};

type UnknownRecord = Record<string, unknown>;

/**
 * 앱에서 실제로 사용할 정규화된 위험 지점.
 */
export type OldmanAccidentRiskPoint = {
  id: string;
  type: 'oldman-accident-zone';

  name: string;
  coordinate: MapCoordinate;

  accidentCount: number;
  casualtyCount: number;
  deathCount: number;
  seriousInjuryCount: number;
  minorInjuryCount: number;
  woundedCount: number;

  /**
   * API가 반환한 행정구역 또는 장소 관련 문자열.
   */
  regionName?: string;

  /**
   * 안전 점수 계산용 기본 위험 가중치.
   *
   * 최종 안전 점수 계산 로직은 별도 서비스에서 처리하는 것이 좋다.
   */
  riskWeight: number;

  source: 'data-go-kr-oldman';
  raw: OldmanAccidentApiItem;
};

export type OldmanAccidentResult = {
  items: OldmanAccidentRiskPoint[];
  totalCount: number;

  request: {
    searchYearCd: string;
    siDo: string;
    guGun: string;
  };
};

export class OldmanAccidentApiError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly resultMsg?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      resultMsg?: string;
      details?: unknown;
    },
  ) {
    super(message);

    this.name = 'OldmanAccidentApiError';
    this.status = options?.status;
    this.code = options?.code;
    this.resultMsg = options?.resultMsg;
    this.details = options?.details;
  }
}

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value);

const getApiKey = (): string => {
  const apiKey =
    process.env.EXPO_PUBLIC_OLDMAN_ACCIDENT_API_KEY?.trim();

  if (!apiKey) {
    throw new OldmanAccidentApiError(
      'EXPO_PUBLIC_OLDMAN_ACCIDENT_API_KEY가 설정되지 않았습니다.',
      {
        code: 'MISSING_API_KEY',
      },
    );
  }

  return apiKey;
};

const toFiniteNumber = (
  value: unknown,
  fallback = 0,
): number => {
  if (
    typeof value === 'number' &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value
    .replaceAll(',', '')
    .trim();

  if (!normalized) {
    return fallback;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const toOptionalString = (
  value: unknown,
): string | undefined => {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    return undefined;
  }

  const normalized = String(value).trim();

  return normalized || undefined;
};

const pickFirstValue = (
  source: UnknownRecord,
  keys: readonly string[],
): unknown => {
  for (const key of keys) {
    const value = source[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      return value;
    }
  }

  return undefined;
};

const isValidLongitude = (
  longitude: number,
): boolean =>
  Number.isFinite(longitude) &&
  longitude >=
    KOREA_LONGITUDE_RANGE.min &&
  longitude <=
    KOREA_LONGITUDE_RANGE.max;

const isValidLatitude = (
  latitude: number,
): boolean =>
  Number.isFinite(latitude) &&
  latitude >=
    KOREA_LATITUDE_RANGE.min &&
  latitude <=
    KOREA_LATITUDE_RANGE.max;

const getCoordinate = (
  item: OldmanAccidentApiItem,
): MapCoordinate | null => {
  const source = item as UnknownRecord;

  const longitude = toFiniteNumber(
    pickFirstValue(source, [
      'lo_crd',
      'longitude',
      'lon',
      'lng',
      'x_crd',
      'x',
    ]),
    Number.NaN,
  );

  const latitude = toFiniteNumber(
    pickFirstValue(source, [
      'la_crd',
      'latitude',
      'lat',
      'y_crd',
      'y',
    ]),
    Number.NaN,
  );

  if (
    !isValidLongitude(longitude) ||
    !isValidLatitude(latitude)
  ) {
    return null;
  }

  return [longitude, latitude];
};

/**
 * 사고·사상자 데이터를 이용한 기본 위험 가중치.
 *
 * MVP 단계의 규칙 기반 점수이며,
 * 이후 안전 점수 서비스에서 조정할 수 있다.
 */
const calculateRiskWeight = ({
  accidentCount,
  casualtyCount,
  deathCount,
  seriousInjuryCount,
}: {
  accidentCount: number;
  casualtyCount: number;
  deathCount: number;
  seriousInjuryCount: number;
}): number => {
  const rawWeight =
    accidentCount * 1 +
    casualtyCount * 0.5 +
    seriousInjuryCount * 2 +
    deathCount * 5;

  return Math.max(
    1,
    Math.round(rawWeight * 10) / 10,
  );
};

const normalizeItem = (
  item: OldmanAccidentApiItem,
  index: number,
): OldmanAccidentRiskPoint | null => {
  const source = item as UnknownRecord;
  const coordinate = getCoordinate(item);

  /*
   * 좌표가 없는 데이터는 지도 마커 및
   * 경로 거리 계산에 사용할 수 없으므로 제외한다.
   */
  if (!coordinate) {
    if (__DEV__) {
      console.warn(
        '[KOROAD-OLDMAN] 유효하지 않은 좌표 항목 제외',
        {
          index,
        },
      );
    }

    return null;
  }

  const accidentCount = toFiniteNumber(
    pickFirstValue(source, [
      'occrrnc_cnt',
      'accident_count',
      'accidentCount',
    ]),
  );

  const casualtyCount = toFiniteNumber(
    pickFirstValue(source, [
      'caslt_cnt',
      'casualty_count',
      'casualtyCount',
    ]),
  );

  const deathCount = toFiniteNumber(
    pickFirstValue(source, [
      'dth_dnv_cnt',
      'death_count',
      'deathCount',
    ]),
  );

  const seriousInjuryCount = toFiniteNumber(
    pickFirstValue(source, [
      'se_dnv_cnt',
      'serious_injury_count',
      'seriousInjuryCount',
    ]),
  );

  const minorInjuryCount = toFiniteNumber(
    pickFirstValue(source, [
      'sl_dnv_cnt',
      'minor_injury_count',
      'minorInjuryCount',
    ]),
  );

  const woundedCount = toFiniteNumber(
    pickFirstValue(source, [
      'wnd_dnv_cnt',
      'wounded_count',
      'woundedCount',
    ]),
  );

  const apiId = toOptionalString(
    pickFirstValue(source, [
      'afos_fid',
      'afos_id',
      'id',
      'spot_id',
    ]),
  );

  const name =
    toOptionalString(
      pickFirstValue(source, [
        'spot_nm',
        'afos_nm',
        'spot_name',
        'location_name',
      ]),
    ) ??
    `보행노인 사고 다발지역 ${index + 1}`;

  const regionName = toOptionalString(
    pickFirstValue(source, [
      'sido_sgg_nm',
      'sigungu_nm',
      'sido_nm',
      'region_name',
    ]),
  );

  return {
    id:
      apiId ??
      `oldman-${coordinate[0]}-${coordinate[1]}-${index}`,

    type: 'oldman-accident-zone',
    name,
    coordinate,

    accidentCount,
    casualtyCount,
    deathCount,
    seriousInjuryCount,
    minorInjuryCount,
    woundedCount,

    regionName,

    riskWeight: calculateRiskWeight({
      accidentCount,
      casualtyCount,
      deathCount,
      seriousInjuryCount,
    }),

    source: 'data-go-kr-oldman',
    raw: item,
  };
};

const findArrayRecursively = (
  value: unknown,
  depth = 0,
): unknown[] | null => {
  /*
   * 비정상적으로 깊은 응답 구조에서
   * 무한 순회를 막기 위한 제한이다.
   */
  if (depth > 6) {
    return null;
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const preferredKeys = [
    'items',
    'item',
    'data',
    'list',
    'result',
    'body',
  ] as const;

  for (const key of preferredKeys) {
    if (!(key in value)) {
      continue;
    }

    const result = findArrayRecursively(
      value[key],
      depth + 1,
    );

    if (result) {
      return result;
    }
  }

  for (const nestedValue of Object.values(value)) {
    const result = findArrayRecursively(
      nestedValue,
      depth + 1,
    );

    if (result) {
      return result;
    }
  }

  return null;
};

const extractSingleItem = (
  value: unknown,
): OldmanAccidentApiItem[] => {
  if (!isRecord(value)) {
    return [];
  }

  /*
   * 일부 공공 API는 항목이 1개일 때 배열이 아니라
   * 단일 객체로 반환할 수 있으므로 이를 배열로 감싼다.
   */
  const possibleContainers = [
    value.items,
    value.item,
    value.data,
    value.list,
  ];

  for (const container of possibleContainers) {
    if (isRecord(container)) {
      if (Array.isArray(container.item)) {
        return container.item.filter(
          isRecord,
        ) as OldmanAccidentApiItem[];
      }

      if (isRecord(container.item)) {
        return [
          container.item as OldmanAccidentApiItem,
        ];
      }

      const looksLikeAccidentItem =
        'lo_crd' in container ||
        'la_crd' in container ||
        'longitude' in container ||
        'latitude' in container;

      if (looksLikeAccidentItem) {
        return [
          container as OldmanAccidentApiItem,
        ];
      }
    }
  }

  return [];
};

const extractApiItems = (
  payload: unknown,
): OldmanAccidentApiItem[] => {
  const foundArray = findArrayRecursively(payload);

  if (foundArray) {
    return foundArray.filter(
      isRecord,
    ) as OldmanAccidentApiItem[];
  }

  return extractSingleItem(payload);
};

const readResultCode = (
  payload: unknown,
): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidates: unknown[] = [
    payload.resultCode,
    payload.result_code,
    payload.code,
  ];

  if (isRecord(payload.header)) {
    candidates.push(
      payload.header.resultCode,
      payload.header.result_code,
      payload.header.code,
    );
  }

  if (isRecord(payload.response)) {
    candidates.push(
      payload.response.resultCode,
      payload.response.result_code,
    );

    if (isRecord(payload.response.header)) {
      candidates.push(
        payload.response.header.resultCode,
        payload.response.header.result_code,
      );
    }
  }

  for (const candidate of candidates) {
    const code = toOptionalString(candidate);

    if (code) {
      return code;
    }
  }

  return undefined;
};

const readResultMessage = (
  payload: unknown,
): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const candidates: unknown[] = [
    payload.resultMsg,
    payload.resultMessage,
    payload.message,
  ];

  if (isRecord(payload.header)) {
    candidates.push(
      payload.header.resultMsg,
      payload.header.resultMessage,
      payload.header.message,
    );
  }

  if (isRecord(payload.response)) {
    candidates.push(
      payload.response.resultMsg,
      payload.response.resultMessage,
      payload.response.message,
    );

    if (isRecord(payload.response.header)) {
      candidates.push(
        payload.response.header.resultMsg,
        payload.response.header.resultMessage,
        payload.response.header.message,
      );
    }
  }

  for (const candidate of candidates) {
    const message = toOptionalString(candidate);

    if (message) {
      return message;
    }
  }

  return undefined;
};

const validateApiResult = (
  payload: unknown,
  status: number,
): void => {
  const resultCode = readResultCode(payload);

  if (!resultCode) {
    return;
  }

  const normalizedCode =
    resultCode.trim();

  if (
    SUCCESS_RESULT_CODES.has(
      normalizedCode,
    )
  ) {
    return;
  }

  const resultMsg =
    readResultMessage(payload);

  throw new OldmanAccidentApiError(
    [
      '보행노인 사고 다발지역 API가 오류를 반환했습니다.',
      `resultCode=${resultCode}`,
      resultMsg
        ? `resultMsg=${resultMsg}`
        : undefined,
    ]
      .filter(Boolean)
      .join(' '),
    {
      status,
      code: resultCode,
      resultMsg,
      details: {
        resultCode,
        resultMsg,
      },
    },
  );
};

type XmlErrorTag =
  | 'resultCode'
  | 'resultMsg'
  | 'returnAuthMsg'
  | 'errMsg';

const decodeXmlEntities = (
  value: string,
): string =>
  value
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, hex: string) =>
        String.fromCodePoint(
          Number.parseInt(hex, 16),
        ),
    )
    .replace(
      /&#(\d+);/g,
      (_, decimal: string) =>
        String.fromCodePoint(
          Number.parseInt(decimal, 10),
        ),
    )
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');

const readXmlTagValue = (
  xml: string,
  tag: XmlErrorTag,
): string | undefined => {
  const tagPattern = new RegExp(
    `<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}\\s*>`,
    'i',
  );
  const match = tagPattern.exec(xml);

  if (!match?.[1]) {
    return undefined;
  }

  const value = match[1]
    .replace(
      /^<!\[CDATA\[([\s\S]*)\]\]>$/,
      '$1',
    )
    .trim();

  return value
    ? decodeXmlEntities(value)
    : undefined;
};

const parseXmlErrorResponse = (
  responseText: string,
  status: number,
): never => {
  const responseLowerCase =
    responseText.toLowerCase();
  const requestWasBlocked =
    responseLowerCase.includes(
      'request blocked',
    );
  const responseIsHtml =
    /^<(?:!doctype\s+html|html)\b/i.test(
      responseText,
    ) ||
    responseLowerCase.includes('<html');

  if (requestWasBlocked) {
    throw new OldmanAccidentApiError(
      '보행노인 사고 API 요청이 차단되었습니다. Request Blocked',
      {
        status,
        code: 'REQUEST_BLOCKED',
        resultMsg: 'Request Blocked',
        details: {
          responseFormat: 'html',
          responseLength:
            responseText.length,
        },
      },
    );
  }

  if (responseIsHtml) {
    throw new OldmanAccidentApiError(
      '보행노인 사고 API가 HTML을 반환했습니다.',
      {
        status,
        code: 'UNEXPECTED_HTML_RESPONSE',
        resultMsg: 'Unexpected HTML response',
        details: {
          responseFormat: 'html',
          responseLength:
            responseText.length,
        },
      },
    );
  }

  const resultCode = readXmlTagValue(
    responseText,
    'resultCode',
  );
  const resultMsg = readXmlTagValue(
    responseText,
    'resultMsg',
  );
  const returnAuthMsg = readXmlTagValue(
    responseText,
    'returnAuthMsg',
  );
  const errMsg = readXmlTagValue(
    responseText,
    'errMsg',
  );
  const extractedMessage =
    resultMsg ??
    returnAuthMsg ??
    errMsg;
  const hasErrorDetails = Boolean(
    resultCode ||
      resultMsg ||
      returnAuthMsg ||
      errMsg,
  );

  if (hasErrorDetails) {
    throw new OldmanAccidentApiError(
      [
        '보행노인 사고 API가 XML 오류를 반환했습니다.',
        resultCode
          ? `resultCode=${resultCode}`
          : undefined,
        extractedMessage
          ? `resultMsg=${extractedMessage}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' '),
      {
        status,
        code:
          resultCode ??
          'OLDMAN_XML_ERROR',
        resultMsg: extractedMessage,
        details: {
          responseFormat: 'xml',
          resultCode,
          errorField: resultMsg
            ? 'resultMsg'
            : returnAuthMsg
              ? 'returnAuthMsg'
              : errMsg
                ? 'errMsg'
                : undefined,
        },
      },
    );
  }

  throw new OldmanAccidentApiError(
    '보행노인 사고 API가 해석할 수 없는 XML을 반환했습니다.',
    {
      status,
      code: 'UNEXPECTED_XML_RESPONSE',
      details: {
        responseFormat: 'xml',
        responseLength:
          responseText.length,
      },
    },
  );
};

const parseResponseBody = (
  responseText: string,
  status: number,
): unknown => {
  const trimmed = responseText.trim();

  if (!trimmed) {
    throw new OldmanAccidentApiError(
      '보행노인 사고 API가 빈 응답을 반환했습니다.',
      {
        status,
        code: 'EMPTY_RESPONSE',
      },
    );
  }

  const firstCharacter = trimmed[0];

  if (firstCharacter === '<') {
    return parseXmlErrorResponse(
      trimmed,
      status,
    );
  }

  if (
    firstCharacter !== '{' &&
    firstCharacter !== '['
  ) {
    throw new OldmanAccidentApiError(
      '보행노인 사고 API 응답 형식을 확인할 수 없습니다.',
      {
        status,
        code: 'UNKNOWN_RESPONSE_FORMAT',
        details: {
          responseLength:
            trimmed.length,
        },
      },
    );
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new OldmanAccidentApiError(
      '보행노인 사고 API 응답을 JSON으로 해석하지 못했습니다.',
      {
        status,
        code: 'INVALID_JSON_RESPONSE',
        details: {
          responseLength:
            trimmed.length,
        },
      },
    );
  }
};

const hasExpectedItemsData = (
  payload: unknown,
): boolean => {
  if (!isRecord(payload)) {
    return false;
  }

  if ('items' in payload) {
    return true;
  }

  if (!isRecord(payload.response)) {
    return false;
  }

  if ('items' in payload.response) {
    return true;
  }

  return (
    isRecord(payload.response.body) &&
    'items' in payload.response.body
  );
};

/**
 * 공공데이터포털은 URL Encode된 인증키를 제공합니다.
 * 디코딩 가능한 키는 원문으로 한 번 되돌린 뒤 다시 한 번만
 * 인코딩해 URLSearchParams의 % 재인코딩을 피합니다.
 */
const encodeServiceKeyOnce = (
  apiKey: string,
): string => {
  let decodedApiKey = apiKey;

  try {
    decodedApiKey =
      decodeURIComponent(apiKey);
  } catch {
    /*
     * 완전한 URL 인코딩 문자열이 아니면
     * 입력값 전체를 원문 키로 간주합니다.
     */
  }

  return encodeURIComponent(
    decodedApiKey,
  );
};

const createRequestUrl = ({
  apiKey,
  searchYearCd,
  siDo,
  guGun,
}: {
  apiKey: string;
  searchYearCd: string;
  siDo: string;
  guGun: string;
}): string => {
  const params = new URLSearchParams({
    searchYearCd,
    siDo,
    guGun,
    type: 'json',
    numOfRows:
      DEFAULT_NUM_OF_ROWS,
    pageNo: DEFAULT_PAGE_NO,
  });
  const encodedServiceKey =
    encodeServiceKeyOnce(apiKey);

  return [
    OLDMAN_ACCIDENT_API_URL,
    `?ServiceKey=${encodedServiceKey}`,
    `&${params.toString()}`,
  ].join('');
};

/**
 * 보행노인 교통사고 다발지역을 조회한다.
 *
 * 반환값은 API 원본 응답이 아니라
 * RUN Guard에서 바로 사용할 수 있는 위험 지점 배열이다.
 */
export const fetchOldmanAccidentZones = async ({
  searchYearCd,
  siDo,
  guGun,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  signal,
}: OldmanAccidentRequest): Promise<OldmanAccidentResult> => {
  const normalizedSearchYearCd =
    searchYearCd.trim();
  const normalizedSiDo = siDo.trim();
  const normalizedGuGun = guGun.trim();

  if (!normalizedSearchYearCd) {
    throw new OldmanAccidentApiError(
      'searchYearCd가 비어 있습니다.',
      {
        code: 'INVALID_SEARCH_YEAR',
      },
    );
  }

  if (!normalizedSiDo) {
    throw new OldmanAccidentApiError(
      'siDo가 비어 있습니다.',
      {
        code: 'INVALID_SIDO',
      },
    );
  }

  if (!normalizedGuGun) {
    throw new OldmanAccidentApiError(
      'guGun이 비어 있습니다.',
      {
        code: 'INVALID_GUGUN',
      },
    );
  }

  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new OldmanAccidentApiError(
      'timeoutMs는 0보다 큰 유한한 숫자여야 합니다.',
      {
        code: 'INVALID_TIMEOUT',
      },
    );
  }

  const apiKey = getApiKey();

  const requestUrl = createRequestUrl({
    apiKey,
    searchYearCd: normalizedSearchYearCd,
    siDo: normalizedSiDo,
    guGun: normalizedGuGun,
  });

  const abortController = new AbortController();
  let requestTimedOut = false;
  let requestAbortedExternally = false;

  const abortFromExternalSignal = () => {
    requestAbortedExternally = true;
    abortController.abort();
  };

  if (signal?.aborted) {
    abortFromExternalSignal();
  } else {
    signal?.addEventListener(
      'abort',
      abortFromExternalSignal,
      {
        once: true,
      },
    );
  }

  const timeoutId = setTimeout(() => {
    if (
      !abortController.signal.aborted
    ) {
      requestTimedOut = true;
      abortController.abort();
    }
  }, timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: abortController.signal,
    });

    const responseText = await response.text();
    const payload = parseResponseBody(
      responseText,
      response.status,
    );

    if (!response.ok) {
      const resultCode =
        readResultCode(payload);
      const resultMsg =
        readResultMessage(payload);

      throw new OldmanAccidentApiError(
        [
          '보행노인 사고 다발지역 API 요청에 실패했습니다.',
          `HTTP ${response.status}`,
          resultMsg,
        ]
          .filter(Boolean)
          .join(' '),
        {
          status: response.status,
          code:
            resultCode ??
            'HTTP_ERROR',
          resultMsg,
          details: {
            resultCode,
            resultMsg,
          },
        },
      );
    }

    validateApiResult(
      payload,
      response.status,
    );

    if (
      !readResultCode(payload) &&
      !hasExpectedItemsData(payload)
    ) {
      throw new OldmanAccidentApiError(
        '보행노인 사고 API 응답에 resultCode와 items 데이터가 없습니다.',
        {
          status: response.status,
          code: 'MALFORMED_RESPONSE',
        },
      );
    }

    const rawItems = extractApiItems(payload);

    const items = rawItems
      .map(normalizeItem)
      .filter(
        (
          item,
        ): item is OldmanAccidentRiskPoint =>
          item !== null,
      );

    return {
      items,
      totalCount: items.length,

      request: {
        searchYearCd: normalizedSearchYearCd,
        siDo: normalizedSiDo,
        guGun: normalizedGuGun,
      },
    };
  } catch (error: unknown) {
    if (
      error instanceof OldmanAccidentApiError
    ) {
      throw error;
    }

    if (
      requestAbortedExternally ||
      signal?.aborted
    ) {
      throw new OldmanAccidentApiError(
        '보행노인 사고 API 요청이 취소되었습니다.',
        {
          code: 'REQUEST_ABORTED',
        },
      );
    }

    if (requestTimedOut) {
      throw new OldmanAccidentApiError(
        `보행노인 사고 API 요청 시간이 ${timeoutMs}ms를 초과했습니다.`,
        {
          code: 'REQUEST_TIMEOUT',
        },
      );
    }

    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new OldmanAccidentApiError(
        '보행노인 사고 API 요청이 취소되었습니다.',
        {
          code: 'REQUEST_ABORTED',
        },
      );
    }

    throw new OldmanAccidentApiError(
      error instanceof Error
        ? error.message
        : '보행노인 사고 API 요청 중 알 수 없는 오류가 발생했습니다.',
      {
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    );
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener(
      'abort',
      abortFromExternalSignal,
    );
  }
};
