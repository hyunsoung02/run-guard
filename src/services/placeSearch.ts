import type {
  SearchPlace,
} from '../navigation/types';

type KakaoPlaceDocument = {
  id: string;
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
};

type KakaoPlaceResponse = {
  documents: KakaoPlaceDocument[];
};

export class PlaceSearchConfigurationError extends Error {}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchPlace[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const apiKey =
    process.env
      .EXPO_PUBLIC_KAKAO_REST_API_KEY;

  if (!apiKey) {
    throw new PlaceSearchConfigurationError(
      '장소 검색 API 키가 설정되지 않았습니다. EXPO_PUBLIC_KAKAO_REST_API_KEY를 설정해 주세요.',
    );
  }

  const response = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(trimmedQuery)}&size=15`,
    {
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
      },
      signal,
    },
  );

 if (!response.ok) {
  const errorBody = await response.text();

  console.error(
    '[Kakao Place Search Error]',
    {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
    },
  );

  throw new Error(
    `장소 검색에 실패했습니다. (${response.status})`,
  );
}

  const data =
    (await response.json()) as KakaoPlaceResponse;

  return data.documents.map(
    (place) => ({
      id: place.id,
      name: place.place_name,
      address:
        place.road_address_name ||
        place.address_name,
      latitude: Number(place.y),
      longitude: Number(place.x),
    }),
  );
}
