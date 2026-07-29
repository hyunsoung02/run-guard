import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type SettingsNumberFieldProps = {
  label: string;
  value: string;
  unit: string;
  error?: string;
  onChangeText: (value: string) => void;
};

export function SettingsNumberField({
  label,
  value,
  unit,
  error,
  onChangeText,
}: SettingsNumberFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.field,
          error && styles.errorField,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          onChangeText={onChangeText}
          style={styles.input}
          value={value}
        />
        <Text style={styles.unit}>
          {unit}
        </Text>
      </View>
      {error && (
        <Text style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: '#333333',
    fontSize: 15,
    fontWeight: '600',
  },
  field: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5D5D5',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  errorField: {
    borderColor: '#C93A3A',
  },
  input: {
    flex: 1,
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
  },
  unit: {
    color: '#777777',
    fontSize: 14,
  },
  error: {
    marginTop: 6,
    color: '#C93A3A',
    fontSize: 12,
  },
});
