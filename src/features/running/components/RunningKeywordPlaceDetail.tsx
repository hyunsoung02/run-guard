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
  Image,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  DETAIL_ADD_IMAGE,
} from '../data/runningStartOptions';
import type {
  KeywordPlace,
} from '../data/runningStartOptions';
import {
  searchKakaoPlaceImages,
} from '../../../services/kakao/kakaoPlaceImageService';
import type {
  PlaceImage,
} from '../../../services/kakao/kakaoPlaceImageService';

type RunningKeywordPlaceDetailProps = {
  place: KeywordPlace;
  onBack: () => void;
};

type ImageSearchStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'empty';

export function RunningKeywordPlaceDetail({
  place,
  onBack,
}: RunningKeywordPlaceDetailProps) {
  const [imagePlaceId, setImagePlaceId] =
    useState<string | null>(null);
  const [imageSearchStatus, setImageSearchStatus] =
    useState<ImageSearchStatus>(
      'idle',
    );
  const [placeImages, setPlaceImages] =
    useState<PlaceImage[]>([]);
  const [
    mainImageIndex,
    setMainImageIndex,
  ] = useState(0);
  const [
    mainUsesThumbnail,
    setMainUsesThumbnail,
  ] = useState(false);
  const [
    failedMainImageIndexes,
    setFailedMainImageIndexes,
  ] = useState<Set<number>>(
    () => new Set(),
  );
  const [
    failedThumbnailUrls,
    setFailedThumbnailUrls,
  ] = useState<Set<string>>(
    () => new Set(),
  );
  const imageRequestIdRef =
    useRef(0);
  const shouldSearchImages =
    place.keyword === '카페';

  useEffect(() => {
    imageRequestIdRef.current += 1;
    const requestId =
      imageRequestIdRef.current;
    const abortController =
      new AbortController();

    setImagePlaceId(place.id);
    setPlaceImages([]);
    setMainImageIndex(0);
    setMainUsesThumbnail(false);
    setFailedMainImageIndexes(
      new Set(),
    );
    setFailedThumbnailUrls(
      new Set(),
    );

    if (!shouldSearchImages) {
      setImageSearchStatus('idle');
      return () =>
        abortController.abort();
    }

    setImageSearchStatus('loading');

    void searchKakaoPlaceImages(
      {
        placeId: place.id,
        placeName: place.name,
        roadAddressName:
          place.address,
      },
      abortController.signal,
    )
      .then((images) => {
        if (
          abortController.signal
            .aborted ||
          requestId !==
            imageRequestIdRef.current
        ) {
          return;
        }

        setPlaceImages(images);
        setImageSearchStatus(
          images.length > 0
            ? 'ready'
            : 'empty',
        );
      })
      .catch(() => {
        if (
          abortController.signal
            .aborted ||
          requestId !==
            imageRequestIdRef.current
        ) {
          return;
        }

        setPlaceImages([]);
        setImageSearchStatus('empty');
      });

    return () => {
      abortController.abort();
    };
  }, [
    place.address,
    place.id,
    place.name,
    shouldSearchImages,
  ]);

  const currentImageStatus =
    imagePlaceId === place.id
      ? imageSearchStatus
      : shouldSearchImages
        ? 'loading'
        : 'idle';
  const mainPlaceImage =
    placeImages[mainImageIndex];
  const mainImageUri =
    mainPlaceImage
      ? mainUsesThumbnail
        ? mainPlaceImage.thumbnailUrl
        : mainPlaceImage.imageUrl
      : null;
  const thumbnailImages =
    useMemo(
      () =>
        placeImages
          .filter(
            (image, index) =>
              index !==
                mainImageIndex &&
              !failedMainImageIndexes.has(
                index,
              ) &&
              !failedThumbnailUrls.has(
                image.thumbnailUrl,
              ),
          )
          .slice(0, 3),
      [
        failedMainImageIndexes,
        failedThumbnailUrls,
        mainImageIndex,
        placeImages,
      ],
    );
  const hiddenImageCount =
    Math.max(
      0,
      placeImages.length -
        1 -
        thumbnailImages.length -
        failedMainImageIndexes.size,
    );

  function handleMainImageError() {
    if (!mainPlaceImage) {
      setImageSearchStatus('empty');
      return;
    }

    if (
      !mainUsesThumbnail &&
      mainPlaceImage.thumbnailUrl !==
        mainPlaceImage.imageUrl
    ) {
      setMainUsesThumbnail(true);
      return;
    }

    const nextImageIndex =
      mainImageIndex + 1;
    setFailedMainImageIndexes(
      (currentIndexes) => {
        const nextIndexes =
          new Set(currentIndexes);
        nextIndexes.add(
          mainImageIndex,
        );
        return nextIndexes;
      },
    );

    if (
      nextImageIndex <
      placeImages.length
    ) {
      setMainImageIndex(
        nextImageIndex,
      );
      setMainUsesThumbnail(false);
      return;
    }

    setImageSearchStatus('empty');
  }

  function handleThumbnailError(
    imageUrl: string,
  ) {
    setFailedThumbnailUrls(
      (currentUrls) => {
        const nextUrls =
          new Set(currentUrls);
        nextUrls.add(imageUrl);
        return nextUrls;
      },
    );
  }

  async function openImageSource(
    image: PlaceImage,
  ) {
    if (!image.sourceUrl) {
      return;
    }

    try {
      await Linking.openURL(
        image.sourceUrl,
      );
    } catch {
      // 이미지 출처 열기 실패는 경유 후보 선택에 영향을 주지 않습니다.
    }
  }

  return (
    <View style={styles.detailScreen}>
      <StatusBar hidden />

      <Pressable
        accessibilityLabel="키워드 코스 화면으로 돌아가기"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [
          styles.detailBackButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons
          color="#111111"
          name="arrow-back"
          size={31}
        />
      </Pressable>

      <View style={styles.detailPlaceRow}>
        <Ionicons
          color="#8C8C8C"
          name="location-outline"
          size={47}
          style={styles.detailLocationIcon}
        />

        <View style={styles.detailPlaceText}>
          <Text style={styles.detailName}>
            {place.name}
          </Text>

          <Text style={styles.detailAddress}>
            {place.address}
          </Text>
        </View>
      </View>

      <View style={styles.detailDistanceSection}>
        <Text style={styles.detailDistanceLabel}>
          출발지에서
        </Text>

        <Text style={styles.detailDistanceValue}>
          {place.distanceM}m
        </Text>
      </View>

      <View style={styles.detailDivider} />

      {shouldSearchImages ? (
        <>
          {currentImageStatus ===
            'ready' &&
          mainPlaceImage &&
          mainImageUri ? (
            <Pressable
              accessibilityLabel={
                mainPlaceImage.sourceUrl
                  ? '대표 사진 출처 열기'
                  : '카페 대표 사진'
              }
              accessibilityRole={
                mainPlaceImage.sourceUrl
                  ? 'link'
                  : 'image'
              }
              disabled={
                !mainPlaceImage.sourceUrl
              }
              onPress={() =>
                void openImageSource(
                  mainPlaceImage,
                )
              }
              style={
                styles.detailMainImageFrame
              }
            >
              <Image
                onError={
                  handleMainImageError
                }
                resizeMode="cover"
                source={{
                  uri: mainImageUri,
                }}
                style={styles.fill}
              />

              <View
                pointerEvents="none"
                style={styles.sourceBadge}
              >
                <Text
                  numberOfLines={1}
                  style={
                    styles.sourceBadgeText
                  }
                >
                  {
                    mainPlaceImage.sourceName
                  }
                </Text>
              </View>
            </Pressable>
          ) : currentImageStatus ===
            'loading' ? (
            <View
              accessibilityLabel="장소 사진 불러오는 중"
              style={[
                styles.detailMainImageFrame,
                styles.imageSkeleton,
              ]}
            />
          ) : (
            <View
              style={[
                styles.detailMainImageFrame,
                styles.emptyImage,
              ]}
            >
              <Ionicons
                color="#929292"
                name="image-outline"
                size={35}
              />
              <Text
                style={
                  styles.emptyImageText
                }
              >
                장소 사진을 찾지 못했어요.
              </Text>
            </View>
          )}

          {currentImageStatus ===
          'loading' ? (
            <View
              style={styles.thumbnailRow}
            >
              {[0, 1, 2].map(
                (index) => (
                  <View
                    key={index}
                    style={[
                      styles.detailThumbnail,
                      styles.imageSkeleton,
                    ]}
                  />
                ),
              )}
            </View>
          ) : currentImageStatus ===
              'ready' &&
            thumbnailImages.length >
              0 ? (
            <View
              style={styles.thumbnailRow}
            >
              {thumbnailImages.map(
                (image, index) => (
                  <Pressable
                    accessibilityLabel={
                      image.sourceUrl
                        ? `${image.sourceName} 사진 출처 열기`
                        : '카페 사진'
                    }
                    accessibilityRole={
                      image.sourceUrl
                        ? 'link'
                        : 'image'
                    }
                    disabled={
                      !image.sourceUrl
                    }
                    key={
                      image.imageUrl
                    }
                    onPress={() =>
                      void openImageSource(
                        image,
                      )
                    }
                    style={
                      styles.thumbnailButton
                    }
                  >
                    <Image
                      onError={() =>
                        handleThumbnailError(
                          image.thumbnailUrl,
                        )
                      }
                      resizeMode="cover"
                      source={{
                        uri:
                          image.thumbnailUrl,
                      }}
                      style={
                        styles.detailThumbnail
                      }
                    />

                    {index === 2 &&
                      hiddenImageCount >
                        0 && (
                        <View
                          pointerEvents="none"
                          style={
                            styles.moreImagesOverlay
                          }
                        >
                          <Text
                            style={
                              styles.moreImagesText
                            }
                          >
                            +
                            {
                              hiddenImageCount
                            }
                          </Text>
                        </View>
                      )}
                  </Pressable>
                ),
              )}
            </View>
          ) : null}
        </>
      ) : (
        <>
          <Image
            source={place.mainImage}
            resizeMode="cover"
            style={
              styles.detailMainImageFrame
            }
          />

          <View
            style={styles.thumbnailRow}
          >
            <Image
              source={place.mainImage}
              resizeMode="cover"
              style={styles.detailThumbnail}
            />

            <Image
              source={place.mainImage}
              resizeMode="cover"
              style={styles.detailThumbnail}
            />

            <Image
              source={place.mainImage}
              resizeMode="cover"
              style={styles.detailThumbnail}
            />

            <Image
              source={DETAIL_ADD_IMAGE}
              resizeMode="contain"
              style={styles.detailAddImage}
            />
          </View>
        </>
      )}

      <View style={styles.detailBottomDivider} />

      <Text style={styles.detailDescription}>
        “{place.description}”
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  detailScreen: {
    flex: 1,
    paddingTop: 58,
    paddingHorizontal: 28,
    backgroundColor: '#FFFFFF',
  },
  detailBackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
  },
  detailPlaceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 18,
  },
  detailPlaceText: {
    flex: 1,
  },
  detailName: {
    color: '#111111',
    fontSize: 25,
    fontWeight: '600',
  },
  detailAddress: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 15,
    fontWeight: '400',
  },
  detailDistanceSection: {
    marginTop: 35,
  },
  detailDistanceLabel: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
  detailDistanceValue: {
    marginTop: 1,
    color: '#67A900',
    fontSize: 26,
    fontWeight: '700',
  },
  detailDivider: {
    height: 1,
    marginTop: 30,
    backgroundColor: '#E0E0E0',
  },
  detailMainImageFrame: {
    width: 310,
    height: 207,
    alignSelf: 'center',
    marginTop: 15,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#D2D2D2',
  },
  thumbnailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 40,
  },
  detailThumbnail: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  thumbnailButton: {
    position: 'relative',
    width: 72,
    height: 72,
    overflow: 'hidden',
    borderRadius: 12,
  },
  detailAddImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  imageSkeleton: {
    backgroundColor: '#D2D2D2',
  },
  emptyImage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  emptyImageText: {
    color: '#777777',
    fontSize: 14,
    fontWeight: '600',
  },
  sourceBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    maxWidth: 180,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 7,
    backgroundColor:
      'rgba(0,0,0,0.58)',
  },
  sourceBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  moreImagesOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor:
      'rgba(0,0,0,0.52)',
  },
  moreImagesText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  detailBottomDivider: {
    height: 1,
    marginTop: 30,
    backgroundColor: '#E5E5E5',
  },
  detailDescription: {
    marginTop: 30,
    color: '#5F5F5F',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.72,
  },
  detailLocationIcon: {
    transform: [{ translateY: 7 }],
  },
});
