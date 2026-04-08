import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ModelOption } from '../types/chat';

// `ServerSettingsProps` defines the presentational inputs required by the server settings section.
type ServerSettingsProps = {
  baseUrl: string;
  bearerToken: string;
  model: string;
  models: ModelOption[];
  isFetchingModels: boolean;
  errorText: string;
  onBaseUrlChange: (value: string) => void;
  onBearerTokenChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onFetchModels: () => void;
};

// `ServerSettings` renders the connection form and fetched model shortcuts for the root screen.
export const ServerSettings = ({
  baseUrl,
  bearerToken,
  model,
  models,
  isFetchingModels,
  errorText,
  onBaseUrlChange,
  onBearerTokenChange,
  onModelChange,
  onFetchModels,
}: ServerSettingsProps) => (
  <View style={styles.container}>
    <Text style={styles.label}>Base URL</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onBaseUrlChange}
      placeholder="http://192.168.2.115:1234"
      placeholderTextColor="#617080"
      style={styles.input}
      value={baseUrl}
    />

    <Text style={styles.label}>Bearer Token</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onBearerTokenChange}
      placeholder="Optional token"
      placeholderTextColor="#617080"
      secureTextEntry
      style={styles.input}
      value={bearerToken}
    />

    <Text style={styles.label}>Model</Text>
    <TextInput
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={onModelChange}
      placeholder="Type or select a model"
      placeholderTextColor="#617080"
      style={styles.input}
      value={model}
    />

    <Pressable onPress={onFetchModels} style={styles.button}>
      <Text style={styles.buttonText}>
        {isFetchingModels ? 'Fetching Models...' : 'Fetch Models'}
      </Text>
    </Pressable>

    {models.length > 0 ? (
      <View style={styles.modelsContainer}>
        <Text style={styles.modelsLabel}>Available Models</Text>
        <View style={styles.modelsList}>
          {models.map((item) => {
            // `isSelected` marks the active model chip shown in the server settings section.
            const isSelected = item.id === model;

            return (
              <Pressable
                key={item.id}
                onPress={() => onModelChange(item.id)}
                style={[styles.modelChip, isSelected ? styles.modelChipSelected : null]}
              >
                <Text
                  style={[
                    styles.modelChipText,
                    isSelected ? styles.modelChipTextSelected : null,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    ) : null}

    {errorText.length > 0 ? <Text style={styles.errorText}>{errorText}</Text> : null}
  </View>
);

// `styles` defines the dark form layout used by the server settings component.
const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    color: '#c3ced9',
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0b0f14',
    borderColor: '#1f2a37',
    borderRadius: 10,
    borderWidth: 1,
    color: '#f5f7fa',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#eff6ff',
    fontSize: 14,
    fontWeight: '600',
  },
  modelsContainer: {
    gap: 8,
    marginTop: 4,
  },
  modelsLabel: {
    color: '#98a3b3',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  modelsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelChip: {
    backgroundColor: '#0b0f14',
    borderColor: '#243244',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modelChipSelected: {
    backgroundColor: '#153266',
    borderColor: '#3b82f6',
  },
  modelChipText: {
    color: '#c3ced9',
    fontSize: 13,
  },
  modelChipTextSelected: {
    color: '#eff6ff',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
});
