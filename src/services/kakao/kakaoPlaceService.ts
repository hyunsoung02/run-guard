const KAKAO_LOCAL_BASE_URL =
  'https://dapi.kakao.com/v2/local/search/keyword.json';
const KAKAO_CATEGORY_URL =
  'https://dapi.kakao.com/v2/local/search/category.json';

const kakaoRestApiKey =
  process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;

export type KakaoPlace = {
  id: string;
  name: string;
  categoryName: string;
  addressName: string;
  roadAddressName: string;
  phone: string;
  longitude: number;
  latitude: number;
  distanceM: number;
  placeUrl: string;
};

type KakaoKeywordDocument = {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  phone: string;
  x: string;
  y: string;
  distance: string;
  place_url: string;
};

type KakaoKeywordResponse = {
  documents: KakaoKeywordDocument[];
};

type SearchNearbyPlacesParams = {
  query: string;
  categoryGroupCode?: 'CE7';
  longitude: number;
  latitude: number;
  radiusM?: number;
  size?: number;
  signal?: AbortSignal;
};

const assertKakaoApiKey = (): string => {
  if (!kakaoRestApiKey) {
    throw new Error(
      '카카오 REST API 키가 설정되지 않았습니다. .env 파일을 확인해 주세요.',
    );
  }

  return kakaoRestApiKey;
};

export const getKakaoAuthorizationHeaders =
  (): Record<string, string> => ({
    Authorization:
      `KakaoAK ${assertKakaoApiKey()}`,
  });

export const searchNearbyPlaces = async ({
  query,
  categoryGroupCode,
  longitude,
  latitude,
  radiusM = 2000,
  size = 10,
  signal,
}: SearchNearbyPlacesParams): Promise<KakaoPlace[]> => {
  if (
    !query.trim() &&
    !categoryGroupCode
  ) {
    throw new Error('검색어를 입력해 주세요.');
  }

  const params = new URLSearchParams({
    x: longitude.toString(),
    y: latitude.toString(),
    radius: radiusM.toString(),
    size: size.toString(),
    sort: 'distance',
  });
  if (categoryGroupCode) {
    params.set(
      'category_group_code',
      categoryGroupCode,
    );
  } else {
    params.set('query', query.trim());
  }

  const response = await fetch(
    `${categoryGroupCode ? KAKAO_CATEGORY_URL : KAKAO_LOCAL_BASE_URL}?${params.toString()}`,
    {
      method: 'GET',
      headers:
        getKakaoAuthorizationHeaders(),
      signal,
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `카카오 장소 검색 실패: ${response.status} ${errorBody}`,
    );
  }

  const data =
    (await response.json()) as KakaoKeywordResponse;

  return data.documents.map((place) => ({
    id: place.id,
    name: place.place_name,
    categoryName: place.category_name,
    addressName: place.address_name,
    roadAddressName: place.road_address_name,
    phone: place.phone,
    longitude: Number(place.x),
    latitude: Number(place.y),
    distanceM: Number(place.distance),
    placeUrl: place.place_url,
  }));
};

export type RoutePlaceKeyword =
  | '공원'
  | '야경'
  | '카페';

export async function searchNearbyRoutePlaces({
  keyword,
  longitude,
  latitude,
  radiusM,
  signal,
}: {
  keyword: RoutePlaceKeyword;
  longitude: number;
  latitude: number;
  radiusM: number;
  signal?: AbortSignal;
}): Promise<KakaoPlace[]> {
  const common = {
    longitude,
    latitude,
    radiusM,
    size: 15,
    signal,
  };
  const searches =
    keyword === '카페'
      ? [
          searchNearbyPlaces({
            ...common,
            query: '',
            categoryGroupCode: 'CE7',
          }),
        ]
      : keyword === '공원'
        ? [
            searchNearbyPlaces({
              ...common,
              query: '공원',
            }),
          ]
        : [
            searchNearbyPlaces({
              ...common,
              query: '야경',
            }),
            searchNearbyPlaces({
              ...common,
              query: '전망대',
            }),
            searchNearbyPlaces({
              ...common,
              query: '전망 명소',
            }),
          ];
  const settled =
    await Promise.allSettled(searches);
  const uniquePlaces =
    new Map<string, KakaoPlace>();

  settled.forEach((result) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    result.value.forEach((place) => {
      if (
        Number.isFinite(
          place.longitude,
        ) &&
        Number.isFinite(
          place.latitude,
        )
      ) {
        uniquePlaces.set(
          place.id,
          place,
        );
      }
    });
  });

  if (
    keyword === '카페' &&
    uniquePlaces.size === 0 &&
    !signal?.aborted
  ) {
    const cafeKeywordPlaces =
      await searchNearbyPlaces({
        ...common,
        query: '카페',
      });

    cafeKeywordPlaces.forEach(
      (place) =>
        uniquePlaces.set(
          place.id,
          place,
        ),
    );
  }

  return Array.from(
    uniquePlaces.values(),
  ).sort(
    (first, second) =>
      first.distanceM -
      second.distanceM,
  );
}
