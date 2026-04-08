import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// `ChatInputProps` defines the presentational inputs required by the chat composer section.
type ChatInputProps = {
  draftMessage: string;
  isSending: boolean;
  canSend: boolean;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
};

// `ChatInput` renders the message composer and action buttons used by the root screen.
export const ChatInput = ({
  draftMessage,
  isSending,
  canSend,
  onDraftMessageChange,
  onSend,
  onClear,
}: ChatInputProps) => (
  <View style={styles.container}>
    <TextInput
      multiline
      onChangeText={onDraftMessageChange}
      placeholder="Ask LM Studio something..."
      placeholderTextColor="#617080"
      style={styles.input}
      textAlignVertical="top"
      value={draftMessage}
    />

    <View style={styles.actions}>
      <Pressable onPress={onClear} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Clear</Text>
      </Pressable>

      <Pressable
        disabled={!canSend}
        onPress={onSend}
        style={[styles.primaryButton, canSend ? null : styles.primaryButtonDisabled]}
      >
        <Text style={styles.primaryButtonText}>{isSending ? 'Sending...' : 'Send'}</Text>
      </Pressable>
    </View>
  </View>
);

// `styles` defines the dark composer layout used by the chat input component.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  input: {
    backgroundColor: '#0b0f14',
    borderColor: '#1f2a37',
    borderRadius: 12,
    borderWidth: 1,
    color: '#f5f7fa',
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 12,
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
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 12,
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
