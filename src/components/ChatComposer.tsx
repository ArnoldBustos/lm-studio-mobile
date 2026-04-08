import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

// `ChatComposerProps` defines the presentational inputs required by the pinned chat composer section.
type ChatComposerProps = {
  draftMessage: string;
  isSending: boolean;
  canSend: boolean;
  bottomInset: number;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
};

// `ChatComposer` renders the pinned message composer and action buttons used by the root screen.
export const ChatComposer = ({
  draftMessage,
  isSending,
  canSend,
  bottomInset,
  onDraftMessageChange,
  onSend,
  onClear,
}: ChatComposerProps) => (
  <View style={[styles.container, { paddingBottom: bottomInset > 0 ? bottomInset : 14 }]}>
    <View style={styles.inputShell}>
      <TextInput
        multiline
        onChangeText={onDraftMessageChange}
        placeholder="Message LM Studio..."
        placeholderTextColor="#617080"
        style={styles.input}
        textAlignVertical="top"
        value={draftMessage}
      />
    </View>

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

// `styles` defines the dark pinned composer layout used by the chat composer component.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10161e',
    borderTopColor: '#1f2a37',
    borderTopWidth: 1,
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  inputShell: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
  },
  input: {
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 132,
    minHeight: 44,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 12,
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
    borderRadius: 12,
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
