import {
  getKakaoAuthorizationHeaders,
} from './kakaoPlaceService';

const KAKAO_COORD_TO_REGION_URL =
  'https://dapi.kakao.com/v2/local/geo/coord2regioncode.json';

export type KakaoRegion = {
  regionType: 'B' | 'H';
  code: string;
  addressName: string;
  region1DepthName: string;
  region2DepthName: string;
  region3DepthName: string;
};

type KakaoRegionDocument = {
  region_type: 'B' | 'H';
  code: string;
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
};

type KakaoRegionResponse = {
  documents: KakaoRegionDocument[];
};

type ResolveKakaoLegalRegionParams = {
  longitude: number;
  latitude: number;
  signal?: AbortSignal;
};

export async function resolveKakaoLegalRegion({
  longitude,
  latitude,
  signal,
}: ResolveKakaoLegalRegionParams): Promise<KakaoRegion> {
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      '행정구역을 조회할 좌표가 유효하지 않습니다.',
    );
  }

  const params = new URLSearchParams({
    x: longitude.toString(),
    y: latitude.toString(),
    input_coord: 'WGS84',
    output_coord: 'WGS84',
  });
  const response = await fetch(
    `${KAKAO_COORD_TO_REGION_URL}?${params.toString()}`,
    {
      method: 'GET',
      headers:
        getKakaoAuthorizationHeaders(),
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(
      `카카오 행정구역 조회 실패: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as KakaoRegionResponse;
  const legalRegion =
    data.documents.find(
      (document) =>
        document.region_type === 'B',
    );

  if (!legalRegion) {
    throw new Error(
      '현재 좌표의 법정동 정보를 찾지 못했습니다.',
    );
  }

  return {
    regionType:
      legalRegion.region_type,
    code: legalRegion.code,
    addressName:
      legalRegion.address_name,
    region1DepthName:
      legalRegion.region_1depth_name,
    region2DepthName:
      legalRegion.region_2depth_name,
    region3DepthName:
      legalRegion.region_3depth_name,
  };
}

export function isGwangmyeongRegion(
  region: KakaoRegion,
): boolean {
  return (
    region.regionType === 'B' &&
    region.code.startsWith('41210') &&
    region.region1DepthName ===
      '경기도' &&
    region.region2DepthName ===
      '광명시'
  );
}
