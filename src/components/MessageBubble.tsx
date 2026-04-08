import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ChatMessage } from '../types/chat';

// `MessageBubbleProps` defines the transcript item shown by the message list.
type MessageBubbleProps = {
  message: ChatMessage;
};

// `MessageBubble` renders one chat message and styles it by sender role for the transcript list.
export const MessageBubble = ({ message }: MessageBubbleProps) => {
  // `isUserMessage` marks messages authored by the local user for alignment and color changes.
  const isUserMessage = message.role === 'user';

  return (
    <View style={[styles.container, isUserMessage ? styles.containerUser : styles.containerAssistant]}>
      <Text style={styles.roleLabel}>{isUserMessage ? 'You' : 'Assistant'}</Text>
      <Text style={styles.content}>{message.content}</Text>
    </View>
  );
};

// `styles` defines the bubble presentation shared across all transcript messages.
const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    gap: 6,
    maxWidth: '92%',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  containerUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#153266',
  },
  containerAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#17202b',
  },
  roleLabel: {
    color: '#98a3b3',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  content: {
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
  },
});
