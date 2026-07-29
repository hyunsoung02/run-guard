import type {
  PropsWithChildren,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

type SettingsFormSectionProps =
  PropsWithChildren<{
    title: string;
  }>;

export function SettingsFormSection({
  title,
  children,
}: SettingsFormSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    color: '#111111',
    fontSize: 18,
    fontWeight: '700',
  },
});
