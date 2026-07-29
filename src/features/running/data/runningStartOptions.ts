import type {
  ComponentProps,
} from 'react';
import type {
  Ionicons,
} from '@expo/vector-icons';
import type {
  ImageSourcePropType,
} from 'react-native';

import type {
  RouteKeyword,
} from '../../map/data/runningRoute';

type IoniconName =
  ComponentProps<typeof Ionicons>['name'];

export type KeywordOption = {
  label: RouteKeyword;
  icon: IoniconName;
};

export type DetailKeyword =
  | '공원'
  | '야경'
  | '카페';

export type KeywordPlace = {
  id: string;
  keyword: DetailKeyword;
  name: string;
  address: string;
  distanceM: number;
  description: string;
  markerImage: ImageSourcePropType;
  mainImage: ImageSourcePropType;
  longitude: number;
  latitude: number;
};

export const RUNNING_START_BUTTON_IMAGE = require(
  '../../../assets/icons/running-start-button.png',
);

export const DETAIL_ADD_IMAGE = require(
  '../../../assets/images/keywords/keyword-detail-add.png',
);

export const KEYWORD_MARKER_IMAGES:
  Record<
    DetailKeyword,
    ImageSourcePropType
  > = {
    공원: require('../../../assets/images/keywords/keyword-park-marker.png'),
    야경: require('../../../assets/images/keywords/keyword-night-marker.png'),
    카페: require('../../../assets/images/keywords/keyword-cafe-marker.png'),
  };

export const KEYWORD_MAIN_IMAGES:
  Record<
    DetailKeyword,
    ImageSourcePropType
  > = {
    공원: KEYWORD_MARKER_IMAGES.공원,
    야경: KEYWORD_MARKER_IMAGES.야경,
    카페: require('../../../assets/images/keywords/keyword-cafe-main.png'),
  };

export const RUNNING_START_KEYWORDS:
  KeywordOption[] = [
    {
      label: '안전',
      icon: 'heart-outline',
    },
    {
      label: '기록',
      icon: 'speedometer-outline',
    },
    {
      label: '공원',
      icon: 'leaf-outline',
    },
    {
      label: '야경',
      icon: 'moon-outline',
    },
    {
      label: '카페',
      icon: 'cafe-outline',
    },
  ];

/**
 * 실제 장소 검색 결과가 연결되기 전에는
 * 임의 장소를 지도에 표시하지 않습니다.
 */
export const RUNNING_START_KEYWORD_PLACES:
  KeywordPlace[] = [];
