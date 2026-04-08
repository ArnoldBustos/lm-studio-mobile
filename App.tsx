import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import { MessageList } from './src/components/MessageList';
import { SettingsModal } from './src/components/SettingsModal';
import { useChat } from './src/hooks/useChat';

// `ChatScreen` renders the safe-area-aware single-screen LM Studio chat layout and connects presentational sections to chat state.
const ChatScreen = () => {
  // `chat` exposes the full screen state and actions from the dedicated chat hook.
  const chat = useChat();
  // `insets` stores the current safe area values used for keyboard and bottom composer spacing.
  const insets = useSafeAreaInsets();
  // `isSettingsModalVisible` tracks whether the settings modal is visible above the main chat screen.
  const [isSettingsModalVisible, setIsSettingsModalVisible] = React.useState(false);
  // `modelsDebugEndpoint` stores the exact models URL shown by the temporary debug block.
  const modelsDebugEndpoint =
    chat.settings.baseUrl.trim().length > 0 ? buildModelsEndpoint(chat.settings.baseUrl) : '';
  // `openSettingsModal` shows the settings modal from the compact top bar gear action.
  const openSettingsModal = () => {
    setIsSettingsModalVisible(true);
  };
  // `closeSettingsModal` hides the settings modal and returns focus to the chat-first screen.
  const closeSettingsModal = () => {
    setIsSettingsModalVisible(false);
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
            onOpenSettings={openSettingsModal}
          />

          <View style={styles.chatPanel}>
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
          />
        </View>
      </KeyboardAvoidingView>

      <SettingsModal
        baseUrl={chat.settings.baseUrl}
        bearerToken={chat.settings.bearerToken}
        model={chat.settings.model}
        models={chat.models}
        isFetchingModels={chat.isFetchingModels}
        errorText={chat.modelError}
        modelsDebugEndpoint={modelsDebugEndpoint}
        visible={isSettingsModalVisible}
        onBaseUrlChange={chat.setBaseUrl}
        onBearerTokenChange={chat.setBearerToken}
        onModelChange={chat.setModel}
        onFetchModels={chat.connect}
        onClearChat={chat.clearChat}
        onClose={closeSettingsModal}
      />
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
});

export default App;
