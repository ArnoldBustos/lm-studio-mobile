import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChatMessage } from '../types/chat';

// `EditMessageModalProps` defines the selected message and callbacks used by the transcript edit modal.
type EditMessageModalProps = {
  message: ChatMessage | null;
  visible: boolean;
  onClose: () => void;
  onSave: (messageId: string, nextContent: string) => void;
};

// `EditMessageModal` renders a focused text editor for locally correcting either user or assistant transcript content.
export const EditMessageModal = ({
  message,
  visible,
  onClose,
  onSave,
}: EditMessageModalProps) => {
  // `insets` stores the safe area spacing used to keep the modal clear of the device bottom inset.
  const insets = useSafeAreaInsets();
  // `draftValue` stores the current editable text shown inside the modal text input.
  const [draftValue, setDraftValue] = React.useState('');

  React.useEffect(() => {
    if (message === null) {
      setDraftValue('');
      return;
    }

    setDraftValue(message.content);
  }, [message]);

  // `trimmedValue` stores the save-ready edit text used for validation and persistence.
  const trimmedValue = draftValue.trim();
  // `canSave` indicates whether the current edit contains content or preserves an attachment-only message.
  const canSave =
    message !== null &&
    (trimmedValue.length > 0 || message.attachments.length > 0);

  // `handleSavePress` applies the local content edit when the modal contains a valid target and value.
  const handleSavePress = () => {
    if (message === null || !canSave) {
      return;
    }

    onSave(message.id, trimmedValue);
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <Text style={styles.title}>
            {message !== null && message.role === 'user' ? 'Edit your message' : 'Edit assistant message'}
          </Text>
          <Text style={styles.subtitle}>
            Save updates the local transcript text without resending the message.
          </Text>

          <TextInput
            multiline
            onChangeText={setDraftValue}
            placeholder="Edit message text..."
            placeholderTextColor="#617080"
            style={styles.input}
            textAlignVertical="top"
            value={draftValue}
          />

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={!canSave}
              onPress={handleSavePress}
              style={[styles.primaryButton, !canSave ? styles.primaryButtonDisabled : null]}
            >
              <Text style={styles.primaryButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// `styles` defines the presentation used by the dedicated transcript edit modal.
const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    color: '#98a3b3',
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 18,
    borderWidth: 1,
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 240,
    minHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 4,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#dbe4ee',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 88,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: '#334155',
  },
  primaryButtonText: {
    color: '#eff6ff',
    fontSize: 14,
    fontWeight: '600',
  },
});
