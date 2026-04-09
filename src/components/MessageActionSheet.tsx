import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPreviewTextFromContentParts } from '../domain/chatContent';
import { ChatMessage } from '../types/chat';

// `MessageActionOption` defines one visible action row shown inside the message action sheet.
type MessageActionOption = {
  key: string;
  label: string;
  isDisabled?: boolean;
  isDestructive?: boolean;
  onPress: () => void;
};

// `MessageActionSheetProps` defines the selected message and action callbacks controlled by the root screen.
type MessageActionSheetProps = {
  message: ChatMessage | null;
  visible: boolean;
  onClose: () => void;
  onCopy: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onRetry: (message: ChatMessage) => void;
  onRewind: (message: ChatMessage) => void;
};

// `MessageActionSheet` renders the shared long-press action menu for transcript messages.
export const MessageActionSheet = ({
  message,
  visible,
  onClose,
  onCopy,
  onDelete,
  onEdit,
  onRetry,
  onRewind,
}: MessageActionSheetProps) => {
  // `insets` stores the current safe area values so the modal sheet clears the system navigation area.
  const insets = useSafeAreaInsets();
  // `isUserMessage` marks user-authored messages that support edit and rewind actions.
  const isUserMessage = message ? message.role === 'user' : false;
  // `isAssistantMessage` marks assistant-authored messages that support retry actions.
  const isAssistantMessage = message ? message.role === 'assistant' : false;
  // `previewText` stores the compact preview text derived from canonical content parts for the action sheet header.
  const previewText =
    message !== null ? getPreviewTextFromContentParts(message.contentParts) : '';
  // `handleCopyPress` runs the copy action for the selected message and then closes the sheet.
  const handleCopyPress = () => {
    if (!message) {
      return;
    }

    onCopy(message);
    onClose();
  };
  // `handleEditPress` forwards the selected transcript message to the higher-level edit controller.
  const handleEditPress = () => {
    if (!message) {
      return;
    }

    onEdit(message);
  };
  // `handleDeletePress` runs the delete action for the selected message and then closes the sheet.
  const handleDeletePress = () => {
    if (!message) {
      return;
    }

    onDelete(message);
    onClose();
  };
  // `handleRewindPress` runs the rewind action for the selected user message and then closes the sheet.
  const handleRewindPress = () => {
    if (!message || !isUserMessage) {
      return;
    }

    onRewind(message);
    onClose();
  };
  // `handleRetryPress` forwards the selected assistant message to the higher-level retry controller.
  const handleRetryPress = () => {
    if (!message || !isAssistantMessage) {
      return;
    }

    onRetry(message);
  };
  // `actionOptions` stores the visible menu rows and their enabled states for the selected message.
  const actionOptions: MessageActionOption[] = [
    {
      key: 'copy',
      label: 'Copy',
      onPress: handleCopyPress,
    },
    {
      key: 'edit',
      label: 'Edit',
      onPress: handleEditPress,
    },
    {
      key: 'retry',
      label: 'Retry',
      isDisabled: !isAssistantMessage,
      onPress: handleRetryPress,
    },
    {
      key: 'delete',
      label: 'Delete',
      isDestructive: true,
      onPress: handleDeletePress,
    },
    {
      key: 'rewind',
      label: 'Rewind',
      isDisabled: !isUserMessage,
      onPress: handleRewindPress,
    },
  ];

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>
            {message ? (isUserMessage ? 'Your message' : 'Assistant message') : 'Message'}
          </Text>
          <Text numberOfLines={3} style={styles.previewText}>
            {previewText}
          </Text>

          {actionOptions.map((actionOption) => (
            <Pressable
              disabled={actionOption.isDisabled}
              key={actionOption.key}
              onPress={actionOption.onPress}
              style={[
                styles.actionButton,
                actionOption.isDisabled ? styles.actionButtonDisabled : null,
              ]}
            >
              <Text
                style={[
                  styles.actionLabel,
                  actionOption.isDisabled ? styles.actionLabelDisabled : null,
                  actionOption.isDestructive ? styles.actionLabelDestructive : null,
                ]}
              >
                {actionOption.label}
              </Text>
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

// `styles` defines the modal sheet presentation used by the shared message action menu.
const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: '#10161e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#334155',
    borderRadius: 999,
    height: 4,
    marginBottom: 4,
    width: 44,
  },
  sheetTitle: {
    color: '#f5f7fa',
    fontSize: 16,
    fontWeight: '700',
  },
  previewText: {
    color: '#98a3b3',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  actionButton: {
    backgroundColor: '#17202b',
    borderColor: '#1e2935',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    color: '#f5f7fa',
    fontSize: 15,
    fontWeight: '600',
  },
  actionLabelDisabled: {
    color: '#8a97a8',
  },
  actionLabelDestructive: {
    color: '#fca5a5',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 12,
  },
  cancelLabel: {
    color: '#dbe4ee',
    fontSize: 14,
    fontWeight: '600',
  },
});
