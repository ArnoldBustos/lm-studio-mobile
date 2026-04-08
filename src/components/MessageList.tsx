import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

// `MessageListProps` defines the transcript and status inputs shown by the chat history section.
type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  errorText: string;
};

// `MessageList` renders the transcript, empty state, loading state, and readable error text.
export const MessageList = ({ messages, isLoading, errorText }: MessageListProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>Messages</Text>

    {messages.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptyText}>
          Enter a base URL, choose a model, and send your first message.
        </Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={styles.listContent} style={styles.list}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>
    )}

    {isLoading ? <Text style={styles.loadingText}>Waiting for LM Studio response...</Text> : null}
    {errorText.length > 0 ? <Text style={styles.errorText}>{errorText}</Text> : null}
  </View>
);

// `styles` defines the dark transcript layout used by the message list component.
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111821',
    borderColor: '#1e2935',
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 12,
    minHeight: 280,
    padding: 14,
  },
  title: {
    color: '#f5f7fa',
    fontSize: 18,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 10,
    paddingBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    borderColor: '#1f2a37',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    minHeight: 200,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: '#dbe4ee',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#98a3b3',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingText: {
    color: '#93c5fd',
    fontSize: 13,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
  },
});
