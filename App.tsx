import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { buildModelsEndpoint } from './src/api/lmStudio';
import { ChatComposer } from './src/components/ChatComposer';
import { ChatHeader } from './src/components/ChatHeader';
import { CollapsiblePanel } from './src/components/CollapsiblePanel';
import { ConnectionBanner } from './src/components/ConnectionBanner';
import { MessageList } from './src/components/MessageList';
import { ServerSettings } from './src/components/ServerSettings';
import { useChat } from './src/hooks/useChat';

// `ChatScreen` renders the safe-area-aware single-screen LM Studio chat layout and connects presentational sections to chat state.
const ChatScreen = () => {
  // `chat` exposes the full screen state and actions from the dedicated chat hook.
  const chat = useChat();
  // `insets` stores the current safe area values used for keyboard and bottom composer spacing.
  const insets = useSafeAreaInsets();
  // `isSettingsOpen` tracks whether the collapsible server settings panel is expanded.
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  // `modelsDebugEndpoint` stores the exact models URL shown by the temporary debug block.
  const modelsDebugEndpoint =
    chat.settings.baseUrl.trim().length > 0 ? buildModelsEndpoint(chat.settings.baseUrl) : '';
  // `settingsSummary` stores the compact status text shown in the collapsible settings header.
  const settingsSummary =
    chat.settings.model.trim().length > 0
      ? `Model: ${chat.settings.model}`
      : chat.connectionState === 'connected'
        ? 'Connected and ready for model selection'
        : 'Base URL, token, and model selection';
  // `toggleSettings` flips the collapsible settings panel open state from the screen header area.
  const toggleSettings = () => {
    setIsSettingsOpen((currentIsSettingsOpen) => !currentIsSettingsOpen);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={styles.keyboardContainer}
      >
        <View style={styles.screen}>
          <ChatHeader
            connectionState={chat.connectionState}
            currentModel={chat.settings.model}
            isConnecting={chat.isFetchingModels}
            onConnect={chat.connect}
          />

          <ConnectionBanner
            connectionError={chat.connectionError}
            connectionState={chat.connectionState}
          />

          <CollapsiblePanel
            isOpen={isSettingsOpen}
            onToggle={toggleSettings}
            subtitle={settingsSummary}
            title="Server Settings"
          >
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
              onFetchModels={chat.connect}
            />

            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>Debug</Text>
              <Text style={styles.debugText}>Base URL: {chat.settings.baseUrl}</Text>
              <Text style={styles.debugText}>Models Endpoint: {modelsDebugEndpoint}</Text>
            </View>
          </CollapsiblePanel>

          <View style={styles.chatPanel}>
            <View style={styles.chatMeta}>
              <Text style={styles.chatTitle}>Chat</Text>
              <Text style={styles.chatSubtitle}>
                {chat.connectionState !== 'connected'
                  ? 'Connect to LM Studio before sending messages'
                  : chat.settings.model.trim().length > 0
                  ? `Using ${chat.settings.model}`
                  : 'Select a model in server settings'}
              </Text>
            </View>
            <MessageList
              messages={chat.messages}
              isLoading={chat.isSending}
              errorText={chat.chatError}
            />
          </View>

          <ChatComposer
            bottomInset={insets.bottom}
            draftMessage={chat.draftMessage}
            isSending={chat.isSending}
            canSend={chat.canSend}
            onDraftMessageChange={chat.setDraftMessage}
            onSend={chat.sendMessage}
            onClear={chat.clearChat}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// `App` wraps the chat screen with the safe area provider required by the modern native safe area API.
const App = () => (
  <SafeAreaProvider>
    <ChatScreen />
  </SafeAreaProvider>
);

// `styles` defines the dark single-screen layout used by the Expo root component.
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0b0f14',
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  screen: {
    flex: 1,
    minHeight: 0,
  },
  chatPanel: {
    flex: 1,
    minHeight: 0,
  },
  chatMeta: {
    gap: 2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  chatTitle: {
    color: '#dbe4ee',
    fontSize: 18,
    fontWeight: '600',
  },
  chatSubtitle: {
    color: '#8a97a8',
    fontSize: 12,
    lineHeight: 18,
  },
  debugCard: {
    backgroundColor: '#0c1218',
    borderColor: '#3a4655',
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 12,
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
