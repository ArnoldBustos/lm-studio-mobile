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
import { EditMessageModal } from './src/components/EditMessageModal';
import { MessageActionSheet } from './src/components/MessageActionSheet';
import { MessageList } from './src/components/MessageList';
import { SettingsModal } from './src/components/SettingsModal';
import { useChat } from './src/hooks/useChat';
import { ChatMessage } from './src/types/chat';

// `ChatScreen` renders the safe-area-aware single-screen LM Studio chat layout and connects presentational sections to chat state.
const ChatScreen = () => {
  // `chat` exposes the full screen state and actions from the dedicated chat hook.
  const chat = useChat();
  // `insets` stores the current safe area values used for keyboard and bottom composer spacing.
  const insets = useSafeAreaInsets();
  // `isSettingsModalVisible` tracks whether the settings modal is visible above the main chat screen.
  const [isSettingsModalVisible, setIsSettingsModalVisible] = React.useState(false);
  // `selectedMessage` stores the transcript item currently targeted by the shared message action sheet.
  const [selectedMessage, setSelectedMessage] = React.useState<ChatMessage | null>(null);
  // `editingModalMessage` stores the transcript item currently being edited inside the dedicated edit modal.
  const [editingModalMessage, setEditingModalMessage] = React.useState<ChatMessage | null>(null);
  // `modelsDebugEndpoint` stores the exact models URL shown by the temporary debug block.
  const modelsDebugEndpoint =
    chat.settings.baseUrl.trim().length > 0 ? buildModelsEndpoint(chat.settings.baseUrl) : '';
  // `openSettingsModal` shows the settings modal from the compact top bar settings icon action.
  const openSettingsModal = () => {
    setIsSettingsModalVisible(true);
  };
  // `closeSettingsModal` hides the settings modal and returns focus to the chat-first screen.
  const closeSettingsModal = () => {
    setIsSettingsModalVisible(false);
  };
  // `openMessageActions` selects a transcript message and shows the shared action sheet for it.
  const openMessageActions = (message: ChatMessage) => {
    setSelectedMessage(message);
  };
  // `closeMessageActions` clears the selected transcript message and hides the shared action sheet.
  const closeMessageActions = () => {
    setSelectedMessage(null);
  };
  // `handleCopyMessage` copies a selected message through the chat hook action layer.
  const handleCopyMessage = async (message: ChatMessage) => {
    await chat.copyMessage(message);
  };
  // `handleDeleteMessage` removes a selected transcript item through the chat hook action layer.
  const handleDeleteMessage = (message: ChatMessage) => {
    chat.deleteMessage(message.id);
  };
  // `handleEditMessage` opens the dedicated edit modal for the selected transcript message.
  const handleEditMessage = (message: ChatMessage) => {
    closeMessageActions();
    setEditingModalMessage(message);
  };
  // `handleRewindMessage` truncates the transcript at the selected user message.
  const handleRewindMessage = (message: ChatMessage) => {
    chat.rewindToMessage(message.id);
  };
  // `handleCloseEditModal` clears the selected edit target and hides the dedicated edit modal.
  const handleCloseEditModal = () => {
    setEditingModalMessage(null);
  };
  // `handleSaveEditedMessage` applies a local transcript edit and then closes the dedicated edit modal.
  const handleSaveEditedMessage = (messageId: string, nextContent: string) => {
    chat.updateMessageContent(messageId, nextContent);
    handleCloseEditModal();
  };
  // `handleRetryMessage` retries the selected assistant branch or failed user turn and closes the shared action sheet.
  const handleRetryMessage = (message: ChatMessage) => {
    closeMessageActions();
    void chat.retryMessage(message.id);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
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
              onOpenMessageActions={openMessageActions}
            />
          </View>

          <ChatComposer
            bottomInset={Math.max(insets.bottom, 12)}
            canAttachImage={
              chat.selectedModelSupportsImages &&
              !chat.isSending &&
              chat.pendingAttachment === null
            }
            editingMessageId={chat.editingMessageId}
            draftMessage={chat.draftMessage}
            isPickingImage={chat.isPickingImage}
            isSending={chat.isSending}
            canSend={chat.canSend}
            pendingAttachment={chat.pendingAttachment}
            onCancelEditing={chat.cancelEditingMessage}
            onDraftMessageChange={chat.setDraftMessage}
            onPickImage={chat.pickImageAttachment}
            onRemoveAttachment={chat.removePendingAttachment}
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

      <MessageActionSheet
        message={selectedMessage}
        visible={selectedMessage !== null}
        onClose={closeMessageActions}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onEdit={handleEditMessage}
        onRetry={handleRetryMessage}
        onRewind={handleRewindMessage}
      />

      <EditMessageModal
        message={editingModalMessage}
        visible={editingModalMessage !== null}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedMessage}
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
