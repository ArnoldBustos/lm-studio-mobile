import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ServerSettings } from './ServerSettings';
import { ModelOption } from '../types/chat';

// `SettingsModalProps` defines the settings data and actions shown inside the modal settings flow.
type SettingsModalProps = {
  baseUrl: string;
  bearerToken: string;
  model: string;
  models: ModelOption[];
  isFetchingModels: boolean;
  errorText: string;
  modelsDebugEndpoint: string;
  visible: boolean;
  onBaseUrlChange: (value: string) => void;
  onBearerTokenChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onFetchModels: () => void;
  onClearChat: () => void;
  onClose: () => void;
};

// `SettingsModal` renders the reusable server settings content inside a dedicated full-screen modal.
export const SettingsModal = ({
  baseUrl,
  bearerToken,
  model,
  models,
  isFetchingModels,
  errorText,
  modelsDebugEndpoint,
  visible,
  onBaseUrlChange,
  onBearerTokenChange,
  onModelChange,
  onFetchModels,
  onClearChat,
  onClose,
}: SettingsModalProps) => {
  // `clearConfirmationText` stores the lightweight confirmation shown after the chat transcript is cleared from the settings modal.
  const [clearConfirmationText, setClearConfirmationText] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      return;
    }

    setClearConfirmationText('');
  }, [visible]);

  // `handleClearChat` clears the chat through the parent callback and then shows a local confirmation inside the settings utilities card.
  const handleClearChat = () => {
    onClearChat();
    setClearConfirmationText('Chat cleared.');
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Server connection, model choice, and utility actions.</Text>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <View style={styles.card}>
            <ServerSettings
              baseUrl={baseUrl}
              bearerToken={bearerToken}
              model={model}
              models={models}
              isFetchingModels={isFetchingModels}
              errorText={errorText}
              onBaseUrlChange={onBaseUrlChange}
              onBearerTokenChange={onBearerTokenChange}
              onModelChange={onModelChange}
              onFetchModels={onFetchModels}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Utilities</Text>

            <Pressable onPress={handleClearChat} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear Chat</Text>
            </Pressable>

            {clearConfirmationText.length > 0 ? (
              <Text style={styles.clearConfirmationText}>{clearConfirmationText}</Text>
            ) : null}
          </View>

          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Debug</Text>
            <Text style={styles.debugText}>Base URL: {baseUrl}</Text>
            <Text style={styles.debugText}>Models Endpoint: {modelsDebugEndpoint}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// `styles` defines the modal settings presentation used to move configuration off the main chat screen.
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0b0f14',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#1e2935',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTextBlock: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8a97a8',
    fontSize: 12,
    lineHeight: 18,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#1d4ed8',
    borderRadius: 12,
    minWidth: 72,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonText: {
    color: '#eff6ff',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 14,
    padding: 16,
  },
  card: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionLabel: {
    color: '#98a3b3',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  clearButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  clearButtonText: {
    color: '#dbe4ee',
    fontSize: 14,
    fontWeight: '600',
  },
  clearConfirmationText: {
    color: '#93c5fd',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  debugCard: {
    backgroundColor: '#0c1218',
    borderColor: '#3a4655',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  debugTitle: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  debugText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
  },
});
