import {
  Ionicons,
} from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  WeeklyPlanItem,
} from '../types/coach.types';

type WeeklyPlanCardProps = {
  item: WeeklyPlanItem;
};

export function WeeklyPlanCard({
  item,
}: WeeklyPlanCardProps) {
  const isCompleted =
    item.status === 'completed';

  return (
    <View
      accessibilityLabel={`${item.dayLabel}, ${item.distanceKm}킬로미터, ${item.title}, ${item.description}, ${isCompleted ? '완료' : '예정'}`}
      accessible
      style={styles.card}
    >
      <View style={styles.schedule}>
        <Text style={styles.day}>
          {item.dayLabel}
        </Text>
        <Text style={styles.distance}>
          {item.distanceKm}km
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.copy}>
        <Text style={styles.title}>
          {item.title}
        </Text>
        <Text style={styles.description}>
          {item.description}
        </Text>
      </View>

      <View
        style={[
          styles.status,
          isCompleted
            ? styles.statusCompleted
            : styles.statusScheduled,
        ]}
      >
        {isCompleted ? (
          <Ionicons
            color="#4E6A01"
            name="checkmark-circle"
            size={17}
          />
        ) : (
          <View
            style={styles.scheduledIcon}
          />
        )}

        <Text
          style={[
            styles.statusText,
            isCompleted
              ? styles.completedText
              : styles.scheduledText,
          ]}
        >
          {isCompleted ? '완료' : '예정'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 108,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    shadowColor: '#111111',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },
  schedule: {
    width: 52,
    alignItems: 'center',
  },
  day: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '700',
  },
  distance: {
    marginTop: 6,
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginLeft: 10,
    marginRight: 14,
    backgroundColor: '#E4E4E4',
  },
  copy: {
    minWidth: 0,
    flex: 1,
    paddingRight: 10,
  },
  title: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    marginTop: 6,
    color: '#777777',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  status: {
    minWidth: 58,
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 17,
  },
  statusCompleted: {
    backgroundColor: '#E8FFC0',
  },
  statusScheduled: {
    backgroundColor: '#EEEEEE',
  },
  scheduledIcon: {
    width: 15,
    height: 15,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#888888',
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  completedText: {
    color: '#4E6A01',
  },
  scheduledText: {
    color: '#777777',
  },
});
