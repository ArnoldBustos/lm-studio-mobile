import React from 'react';
import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ChatAttachment } from '../types/chat';

// `ChatComposerProps` defines the presentational inputs required by the pinned chat composer section.
type ChatComposerProps = {
  draftMessage: string;
  isSending: boolean;
  isPickingImage: boolean;
  canSend: boolean;
  canAttachImage: boolean;
  editingMessageId: string | null;
  bottomInset: number;
  pendingAttachment: ChatAttachment | null;
  onDraftMessageChange: (value: string) => void;
  onSend: () => void;
  onCancelEditing: () => void;
  onPickImage: () => void;
  onRemoveAttachment: () => void;
};

// `ChatComposer` renders the pinned message composer and action buttons used by the root screen.
export const ChatComposer = ({
  draftMessage,
  isSending,
  isPickingImage,
  canSend,
  canAttachImage,
  editingMessageId,
  bottomInset,
  pendingAttachment,
  onDraftMessageChange,
  onSend,
  onCancelEditing,
  onPickImage,
  onRemoveAttachment,
}: ChatComposerProps) => {
  // `attachButtonLabel` stores the compact attach button label used while the picker is busy.
  const attachButtonLabel = isPickingImage ? '...' : 'Image';
  // `sendButtonLabel` stores the compact send button label used while the chat request is in flight.
  const sendButtonLabel = isSending ? '...' : 'Send';

  return (
    <View style={[styles.container, { paddingBottom: bottomInset }]}>
      {editingMessageId ? (
        <View style={styles.editingBanner}>
          <Text style={styles.editingLabel}>Editing previous message</Text>
          <Pressable onPress={onCancelEditing} style={styles.editingButton}>
            <Text style={styles.editingButtonText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <Pressable
          disabled={!canAttachImage || isPickingImage}
          onPress={onPickImage}
          style={[
            styles.secondaryButton,
            !canAttachImage || isPickingImage ? styles.secondaryButtonDisabled : null,
          ]}
        >
          <Text style={styles.secondaryButtonText}>{attachButtonLabel}</Text>
        </Pressable>

        <View style={styles.inputShell}>
          {pendingAttachment ? (
            <View style={styles.attachmentPreview}>
              <Image
                contentFit="cover"
                source={{ uri: pendingAttachment.uri }}
                style={styles.attachmentImage}
              />
              <View style={styles.attachmentMeta}>
                <Text numberOfLines={1} style={styles.attachmentTitle}>
                  {pendingAttachment.fileName}
                </Text>
                <Text style={styles.attachmentSubtitle}>
                  {pendingAttachment.width} x {pendingAttachment.height}
                </Text>
              </View>

              <Pressable onPress={onRemoveAttachment} style={styles.attachmentRemoveButton}>
                <Text style={styles.attachmentRemoveButtonText}>Remove</Text>
              </Pressable>
            </View>
          ) : null}

          <TextInput
            multiline
            onChangeText={onDraftMessageChange}
            placeholder={editingMessageId ? 'Edit your message...' : 'Message LM Studio...'}
            placeholderTextColor="#617080"
            style={styles.input}
            textAlignVertical="top"
            value={draftMessage}
          />
        </View>

        <Pressable
          disabled={!canSend}
          onPress={onSend}
          style={[styles.primaryButton, canSend ? null : styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{sendButtonLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
};

// `styles` defines the dark pinned composer layout used by the chat composer component.
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10161e',
    borderTopColor: '#1f2a37',
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  editingBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  editingLabel: {
    color: '#93c5fd',
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  editingButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  editingButtonText: {
    color: '#dbe4ee',
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentPreview: {
    alignItems: 'center',
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    padding: 10,
  },
  attachmentImage: {
    backgroundColor: '#0b0f14',
    borderRadius: 12,
    height: 56,
    width: 56,
  },
  attachmentMeta: {
    flex: 1,
    minWidth: 0,
  },
  attachmentTitle: {
    color: '#f5f7fa',
    fontSize: 13,
    fontWeight: '600',
  },
  attachmentSubtitle: {
    color: '#8a97a8',
    fontSize: 12,
    marginTop: 2,
  },
  attachmentRemoveButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  attachmentRemoveButtonText: {
    color: '#fca5a5',
    fontSize: 12,
    fontWeight: '600',
  },
  inputShell: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 132,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#1b2430',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 70,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  secondaryButtonDisabled: {
    backgroundColor: '#202a36',
  },
  secondaryButtonText: {
    color: '#dbe4ee',
    fontSize: 13,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 16,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 76,
    paddingHorizontal: 14,
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
