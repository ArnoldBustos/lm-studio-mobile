import React from 'react';
import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getFirstImageAttachmentFromContentParts,
  getTextFromContentParts,
} from '../domain/chatContent';
import { ChatMessage } from '../types/chat';

// `MessageBubbleProps` defines the transcript item shown by the message list.
type MessageBubbleProps = {
  message: ChatMessage;
  onOpenActions: (message: ChatMessage) => void;
};

// `MessageBubble` renders one chat message and styles it by sender role for the transcript list.
export const MessageBubble = ({ message, onOpenActions }: MessageBubbleProps) => {
  // `isUserMessage` marks messages authored by the local user for alignment and color changes.
  const isUserMessage = message.role === 'user';
  // `imageAttachment` stores the first canonical image block shown inline with the current one-image message bubble.
  const imageAttachment = getFirstImageAttachmentFromContentParts(message.contentParts);
  // `messageText` stores the canonical text content shown inside the current message bubble.
  const messageText = getTextFromContentParts(message.contentParts);
  // `handleLongPress` forwards the pressed message to the higher-level action menu controller.
  const handleLongPress = () => {
    onOpenActions(message);
  };

  return (
    <View style={isUserMessage ? styles.rowUser : styles.rowAssistant}>
      <Pressable
        delayLongPress={220}
        onLongPress={handleLongPress}
        style={[styles.container, isUserMessage ? styles.containerUser : styles.containerAssistant]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.roleLabel}>{isUserMessage ? 'You' : 'Assistant'}</Text>
        </View>
        {imageAttachment ? (
          <Image contentFit="cover" source={{ uri: imageAttachment.uri }} style={styles.attachmentImage} />
        ) : null}
        {messageText.length > 0 ? <Text style={styles.content}>{messageText}</Text> : null}
      </Pressable>
    </View>
  );
};

// `styles` defines the bubble presentation shared across all transcript messages.
const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    gap: 6,
    maxWidth: '85%',
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  rowUser: {
    alignItems: 'flex-end',
    paddingLeft: 44,
  },
  rowAssistant: {
    alignItems: 'flex-start',
    paddingRight: 44,
  },
  containerUser: {
    backgroundColor: '#1f4ea3',
    borderBottomRightRadius: 6,
  },
  containerAssistant: {
    backgroundColor: '#17202b',
    borderBottomLeftRadius: 6,
  },
  roleLabel: {
    color: '#98a3b3',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attachmentImage: {
    backgroundColor: '#0b0f14',
    borderRadius: 12,
    height: 148,
    width: 148,
  },
  content: {
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
  },
});
