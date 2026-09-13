import {
  resolveKakaoLegalRegion,
} from '../kakao/kakaoRegionService';
import {
  fetchOldmanAccidentZones,
} from './oldmanAccidentService';

/**
 * 대한민국 법정동 코드는 앞 2자리가 시도, 다음 3자리가 시군구다.
 * 좌표를 먼저 행정구역으로 변환하므로 특정 도시를 서비스 로직에
 * 고정하지 않고, 같은 안전 점수 엔진에 전국 데이터를 공급할 수 있다.
 */
const LEGAL_REGION_CODE_PATTERN = /^\d{5,}$/;

/**
 * 도로교통공단 보행노인 사고다발지역 API의 현재 앱 사용 기준연도.
 * API 제공자가 새 연도를 공개하면 이 상수와 README를 함께 갱신한다.
 */
export const OLDMAN_ACCIDENT_DATA_YEAR = '2024';

type LoadNationalSafetyDataParams = {
  longitude: number;
  latitude: number;
  signal?: AbortSignal;
};

export async function loadNationalSafetyData({
  longitude,
  latitude,
  signal,
}: LoadNationalSafetyDataParams) {
  const region = await resolveKakaoLegalRegion({
    longitude,
    latitude,
    signal,
  });

  if (!LEGAL_REGION_CODE_PATTERN.test(region.code)) {
    throw new Error(
      '안전 데이터를 조회할 법정동 코드 형식이 올바르지 않습니다.',
    );
  }

  const result =
    await fetchOldmanAccidentZones({
      searchYearCd:
        OLDMAN_ACCIDENT_DATA_YEAR,
      siDo: region.code.slice(0, 2),
      guGun: region.code.slice(2, 5),
      timeoutMs: 4_000,
      signal,
    });

  if (result.items.length === 0) {
    throw new Error(
      '해당 시군구의 보행노인 사고다발지역 데이터가 제공되지 않습니다.',
    );
  }

  return result;
}
