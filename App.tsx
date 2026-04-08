import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChatInput } from './src/components/ChatInput';
import { MessageList } from './src/components/MessageList';
import { ServerSettings } from './src/components/ServerSettings';
import { buildModelsEndpoint } from './src/api/lmStudio';
import { useChat } from './src/hooks/useChat';

// `App` renders the single-screen LM Studio client and connects presentational sections to chat state.
const App = () => {
  // `chat` exposes the full screen state and actions from the dedicated chat hook.
  const chat = useChat();
  // `modelsDebugEndpoint` stores the exact models URL shown by the temporary debug block.
  const modelsDebugEndpoint =
    chat.settings.baseUrl.trim().length > 0 ? buildModelsEndpoint(chat.settings.baseUrl) : '';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          style={styles.scrollView}
        >
          <View style={styles.screen}>
            <Text style={styles.title}>LM Studio LAN Chat</Text>
            <Text style={styles.subtitle}>
              Connect to a Windows-hosted LM Studio server over your local network.
            </Text>

            <ServerSettings
              baseUrl={chat.settings.baseUrl}
              bearerToken={chat.settings.bearerToken}
              model={chat.settings.model}
              models={chat.models}
              isFetchingModels={chat.isFetchingModels}
              errorText={chat.modelError}
              onBaseUrlChange={chat.setBaseUrl}
              onBearerTokenChange={chat.setBearerToken}
              onModelChange={chat.setModel}
              onFetchModels={chat.fetchModels}
            />

            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>Debug</Text>
              <Text style={styles.debugText}>Base URL: {chat.settings.baseUrl}</Text>
              <Text style={styles.debugText}>Models Endpoint: {modelsDebugEndpoint}</Text>
            </View>

            <View style={styles.chatSection}>
              <Text style={styles.sectionTitle}>Chat</Text>
              <MessageList
                messages={chat.messages}
                isLoading={chat.isSending}
                errorText={chat.chatError}
              />
              <ChatInput
                draftMessage={chat.draftMessage}
                isSending={chat.isSending}
                canSend={chat.canSend}
                onDraftMessageChange={chat.setDraftMessage}
                onSend={chat.sendMessage}
                onClear={chat.clearChat}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// `styles` defines the dark single-screen layout used by the Expo root component.
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0b0f14',
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  screen: {
    flex: 1,
    gap: 16,
    padding: 16,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#98a3b3',
    fontSize: 14,
    lineHeight: 20,
  },
  chatSection: {
    flex: 1,
    gap: 12,
    minHeight: 420,
  },
  sectionTitle: {
    color: '#dbe4ee',
    fontSize: 18,
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: '#111821',
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

export default App;
