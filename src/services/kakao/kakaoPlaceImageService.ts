import {
  getKakaoAuthorizationHeaders,
} from './kakaoPlaceService';

const KAKAO_IMAGE_SEARCH_URL =
  'https://dapi.kakao.com/v2/search/image';
const IMAGE_SEARCH_RESULT_SIZE = 8;
const MAX_PLACE_IMAGES = 6;
const MIN_IMAGE_EDGE_PX = 160;
const MIN_IMAGE_AREA_PX = 40_000;

export type KakaoPlaceImageSearchTarget = {
  placeId: string;
  placeName: string;
  roadAddressName?: string;
  addressName?: string;
};

export type KakaoImageDocument = {
  collection: string;
  thumbnail_url: string;
  image_url: string;
  width: number;
  height: number;
  display_sitename: string;
  doc_url: string;
  datetime: string;
};

type KakaoImageResponse = {
  documents: KakaoImageDocument[];
};

export type PlaceImage = {
  thumbnailUrl: string;
  imageUrl: string;
  sourceName: string;
  sourceUrl: string;
  width: number;
  height: number;
};

const placeImageCache =
  new Map<string, PlaceImage[]>();

function isHttpsUrl(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^https:\/\/[^\s]+$/i.test(
      value.trim(),
    )
  );
}

function isHttpUrl(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    /^https?:\/\/[^\s]+$/i.test(
      value.trim(),
    )
  );
}

export function createKakaoPlaceImageQuery(
  place: KakaoPlaceImageSearchTarget,
): string {
  return [
    place.placeName,
    place.roadAddressName ||
      place.addressName,
  ]
    .map((value) => value?.trim())
    .filter(
      (value): value is string =>
        Boolean(value),
    )
    .join(' ');
}

export function normalizeKakaoPlaceImages(
  documents: readonly KakaoImageDocument[],
): PlaceImage[] {
  const uniqueImages =
    new Map<string, PlaceImage>();

  for (const document of documents) {
    const width = Number(
      document.width,
    );
    const height = Number(
      document.height,
    );

    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0 ||
      Math.min(width, height) <
        MIN_IMAGE_EDGE_PX ||
      width * height <
        MIN_IMAGE_AREA_PX
    ) {
      continue;
    }

    const fullImageUrl =
      isHttpsUrl(document.image_url)
        ? document.image_url.trim()
        : null;
    const secureThumbnailUrl =
      isHttpsUrl(
        document.thumbnail_url,
      )
        ? document.thumbnail_url.trim()
        : null;
    const imageUrl =
      fullImageUrl ??
      secureThumbnailUrl;
    const thumbnailUrl =
      secureThumbnailUrl ??
      fullImageUrl;

    if (
      imageUrl === null ||
      thumbnailUrl === null ||
      uniqueImages.has(imageUrl)
    ) {
      continue;
    }

    uniqueImages.set(imageUrl, {
      imageUrl,
      thumbnailUrl,
      sourceName:
        document.display_sitename
          ?.trim() ||
        document.collection?.trim() ||
        'Daum 이미지 검색',
      sourceUrl: isHttpUrl(
        document.doc_url,
      )
        ? document.doc_url.trim()
        : '',
      width,
      height,
    });

    if (
      uniqueImages.size >=
      MAX_PLACE_IMAGES
    ) {
      break;
    }
  }

  return Array.from(
    uniqueImages.values(),
  );
}

export async function searchKakaoPlaceImages(
  place: KakaoPlaceImageSearchTarget,
  signal?: AbortSignal,
): Promise<PlaceImage[]> {
  const cacheKey =
    place.placeId.trim();
  const cachedImages =
    placeImageCache.get(cacheKey);

  if (cachedImages) {
    return cachedImages.map(
      (image) => ({ ...image }),
    );
  }

  const query =
    createKakaoPlaceImageQuery(
      place,
    );

  if (!cacheKey || !query) {
    return [];
  }

  const params = new URLSearchParams({
    query,
    sort: 'accuracy',
    size:
      IMAGE_SEARCH_RESULT_SIZE.toString(),
    page: '1',
  });
  const response = await fetch(
    `${KAKAO_IMAGE_SEARCH_URL}?${params.toString()}`,
    {
      method: 'GET',
      headers:
        getKakaoAuthorizationHeaders(),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `카카오 장소 이미지 검색 실패: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as KakaoImageResponse;
  const images =
    normalizeKakaoPlaceImages(
      Array.isArray(data.documents)
        ? data.documents
        : [],
    );

  if (!signal?.aborted) {
    placeImageCache.set(
      cacheKey,
      images,
    );
  }

  return images.map(
    (image) => ({ ...image }),
  );
}
