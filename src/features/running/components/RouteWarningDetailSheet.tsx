import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  RouteSafetyEvaluation,
  RouteWarningPoint,
} from '../../../services/safety/routeSafetyService';
import {
  createWarningDetailContent,
  WARNING_DATA_SOURCE,
  WARNING_DETECTION_CRITERIA,
} from '../utils/routeWarningDetailContent';

type RouteWarningDetailSheetProps = {
  visible: boolean;
  evaluation?:
    | RouteSafetyEvaluation
    | null;
  onClose: () => void;
  onPressWarningPoint?: (
    warningPoint: RouteWarningPoint,
  ) => void;
};

const OPEN_DURATION_MS = 260;
const CLOSE_DURATION_MS = 210;

export function RouteWarningDetailSheet({
  visible,
  evaluation,
  onClose,
  onPressWarningPoint,
}: RouteWarningDetailSheetProps) {
  const [
    modalVisible,
    setModalVisible,
  ] = useState(visible);
  const animation = useRef(
    new Animated.Value(
      visible ? 1 : 0,
    ),
  ).current;
  const content = useMemo(
    () =>
      createWarningDetailContent(
        evaluation,
      ),
    [evaluation],
  );

  useEffect(() => {
    animation.stopAnimation();

    if (visible) {
      setModalVisible(true);

      const animationFrameId =
        requestAnimationFrame(() => {
          Animated.timing(animation, {
            toValue: 1,
            duration:
              OPEN_DURATION_MS,
            easing: Easing.out(
              Easing.cubic,
            ),
            useNativeDriver: true,
          }).start();
        });

      return () => {
        cancelAnimationFrame(
          animationFrameId,
        );
      };
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: CLOSE_DURATION_MS,
      easing: Easing.in(
        Easing.cubic,
      ),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setModalVisible(false);
      }
    });
  }, [animation, visible]);

  useEffect(
    () => () => {
      animation.stopAnimation();
    },
    [animation],
  );

  const backdropOpacity =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.42],
    });
  const panelTranslateY =
    animation.interpolate({
      inputRange: [0, 1],
      outputRange: [520, 0],
    });

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={modalVisible}
    >
      <View style={styles.modalRoot}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.backdrop,
            {
              opacity:
                backdropOpacity,
            },
          ]}
        />

        <Pressable
          accessibilityLabel="주의 지점 상세 정보 닫기"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            {
              transform: [
                {
                  translateY:
                    panelTranslateY,
                },
              ],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {content.title}
            </Text>

            <Pressable
              accessibilityLabel="주의 지점 상세 정보 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Ionicons
                color="#5C5C5C"
                name="close"
                size={24}
              />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
            style={styles.scrollView}
          >
            <View
              style={
                styles.summaryContainer
              }
            >
              {content.isLoading ? (
                <ActivityIndicator
                  color="#4E6A01"
                  size="small"
                />
              ) : (
                <Ionicons
                  color="#4E6A01"
                  name="warning-outline"
                  size={25}
                />
              )}

              <Text
                style={
                  styles.summaryLabel
                }
              >
                {content.summaryLabel}
              </Text>
            </View>

            <View style={styles.section}>
              <Text
                style={
                  styles.sectionLabel
                }
              >
                {content.resultTitle}
              </Text>

              <Text
                style={
                  styles.resultDescription
                }
              >
                {
                  content.resultDescription
                }
              </Text>
            </View>

            {content.warningItems.length >
              0 && (
              <View style={styles.section}>
                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  주요 주의 지점
                </Text>

                <View
                  style={
                    styles.warningList
                  }
                >
                  {content.warningItems.map(
                    (item, index) => (
                      <Pressable
                        accessibilityLabel={[
                          `${index + 1}. ${item.title}`,
                          item.distanceLabel,
                          item.accidentCountLabel,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        disabled={
                          !onPressWarningPoint
                        }
                        key={item.id}
                        onPress={() =>
                          onPressWarningPoint?.(
                            item.warningPoint,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.warningItem,
                          pressed &&
                            styles.pressed,
                        ]}
                      >
                        <View
                          style={
                            styles.warningBadge
                          }
                        >
                          <Text
                            style={
                              styles.warningBadgeText
                            }
                          >
                            !
                          </Text>
                        </View>

                        <View
                          style={
                            styles.warningContent
                          }
                        >
                          <Text
                            style={
                              styles.warningTitle
                            }
                          >
                            {index + 1}.{' '}
                            {item.title}
                          </Text>

                          {item.distanceLabel && (
                            <Text
                              style={
                                styles.warningMeta
                              }
                            >
                              {
                                item.distanceLabel
                              }
                            </Text>
                          )}

                          {item.accidentCountLabel && (
                            <Text
                              style={
                                styles.warningMeta
                              }
                            >
                              {
                                item.accidentCountLabel
                              }
                            </Text>
                          )}
                        </View>
                      </Pressable>
                    ),
                  )}
                </View>

                {content.remainingCount >
                  0 && (
                  <Text
                    style={
                      styles.remainingText
                    }
                  >
                    외{' '}
                    {
                      content.remainingCount
                    }
                    곳의 주의 지점이 지도에
                    표시되어 있습니다.
                  </Text>
                )}
              </View>
            )}

            {content.showEvaluationCriteria && (
              <View style={styles.section}>
                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  평가 기준
                </Text>

                <View
                  style={
                    styles.criteriaList
                  }
                >
                  {WARNING_DETECTION_CRITERIA.map(
                    (criterion) => (
                      <View
                        key={criterion}
                        style={
                          styles.criteriaItem
                        }
                      >
                        <Text
                          style={
                            styles.bullet
                          }
                        >
                          •
                        </Text>

                        <Text
                          style={
                            styles.criteriaText
                          }
                        >
                          {criterion}
                        </Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

            {content.showDataSource && (
              <View style={styles.section}>
                <Text
                  style={
                    styles.sectionLabel
                  }
                >
                  데이터 출처
                </Text>

                <Text
                  style={
                    styles.bodyText
                  }
                >
                  {WARNING_DATA_SOURCE}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.section,
                styles.notice,
              ]}
            >
              <Text
                style={
                  styles.sectionLabel
                }
              >
                안내
              </Text>

              <Text
                style={
                  styles.noticeText
                }
              >
                {content.disclaimer}
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  panel: {
    maxHeight: '84%',
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 12,
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: 'center',
    marginTop: 10,
    borderRadius: 2,
    backgroundColor:
      'rgba(92,92,92,0.3)',
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 22,
  },
  title: {
    color: '#111111',
    fontSize: 21,
    fontWeight: '800',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor:
      'rgba(126,172,0,0.1)',
  },
  scrollView: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: 22,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  summaryContainer: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor:
      'rgba(126,172,0,0.2)',
    borderRadius: 16,
    backgroundColor:
      'rgba(126,172,0,0.08)',
  },
  summaryLabel: {
    flex: 1,
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    gap: 9,
  },
  sectionLabel: {
    color: '#4E6A01',
    fontSize: 13,
    fontWeight: '700',
  },
  resultDescription: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
  warningList: {
    gap: 10,
  },
  warningItem: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    padding: 12,
    borderRadius: 14,
    backgroundColor:
      'rgba(126,172,0,0.08)',
  },
  warningBadge: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 13,
    backgroundColor: '#E5484D',
  },
  warningBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  warningContent: {
    flex: 1,
    gap: 3,
  },
  warningTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  warningMeta: {
    color: '#5C5C5C',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  remainingText: {
    color: '#5C5C5C',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
  },
  criteriaList: {
    gap: 5,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    width: 16,
    color: '#4E6A01',
    fontSize: 14,
    lineHeight: 21,
  },
  criteriaText: {
    flex: 1,
    color: '#5C5C5C',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 21,
  },
  bodyText: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  notice: {
    padding: 14,
    borderRadius: 14,
    backgroundColor:
      'rgba(92,92,92,0.07)',
  },
  noticeText: {
    color: '#5C5C5C',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.68,
  },
});
