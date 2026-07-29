import type {
  ImageSourcePropType,
} from 'react-native';

import type {
  RunningRecordPayload,
} from '../../../navigation/types';

export type RunningRecordListItem = {
  id: string;
  courseLocation: string;
  mapThumbnail?: ImageSourcePropType;
  record: RunningRecordPayload;
};
