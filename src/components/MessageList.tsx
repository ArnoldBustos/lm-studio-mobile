import React from 'react';
import {
  FlatList,
  Keyboard,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChatMessage } from '../types/chat';
import { MessageBubble } from './MessageBubble';

// `MessageListProps` defines the transcript and status inputs shown by the chat history section.
type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  errorText: string;
  onOpenMessageActions: (message: ChatMessage) => void;
};

// `renderMessageItem` renders one transcript row for the chat list.
const createRenderMessageItem = (onOpenMessageActions: (message: ChatMessage) => void) => {
  // `renderMessageItem` renders one transcript row and forwards long-press events to the higher-level action sheet.
  const renderMessageItem: ListRenderItem<ChatMessage> = ({ item }) => (
    <MessageBubble message={item} onOpenActions={onOpenMessageActions} />
  );

  return renderMessageItem;
};

// `MessageList` renders the transcript as a chat list, keeps the newest items visible, and dismisses the keyboard on drag.
export const MessageList = ({
  messages,
  isLoading,
  errorText,
  onOpenMessageActions,
}: MessageListProps) => {
  // `listRef` stores the flat list instance used for automatic scroll-to-bottom behavior.
  const listRef = React.useRef<FlatList<ChatMessage>>(null);
  // `isNearBottomRef` tracks whether the user is already near the latest messages so auto-scroll does not fight manual scrolling.
  const isNearBottomRef = React.useRef(true);
  // `renderMessageItem` stores the stable row renderer that opens the shared message action sheet.
  const renderMessageItem = React.useMemo(
    () => createRenderMessageItem(onOpenMessageActions),
    [onOpenMessageActions]
  );

  // `handleScroll` updates the near-bottom flag so auto-scroll only happens when the user is already near the latest message.
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // `layoutMeasurement` stores the visible transcript viewport metrics from the current scroll event.
    const layoutMeasurement = event.nativeEvent.layoutMeasurement;
    // `contentOffset` stores the current transcript scroll position from the current scroll event.
    const contentOffset = event.nativeEvent.contentOffset;
    // `contentSize` stores the full transcript content size from the current scroll event.
    const contentSize = event.nativeEvent.contentSize;
    // `distanceFromBottom` stores how far the user is from the latest transcript item.
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    isNearBottomRef.current = distanceFromBottom < 72;
  };

  React.useEffect(() => {
    if (messages.length === 0 && !isLoading) {
      return;
    }

    if (!isNearBottomRef.current) {
      return;
    }

    // `scrollTimer` delays the scroll until after the latest list layout pass completes.
    const scrollTimer = setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollToEnd({ animated: true });
      }
    }, 40);

    return () => clearTimeout(scrollTimer);
  }, [isLoading, messages.length]);

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            Open settings, connect to LM Studio, and send your first message.
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          onScrollBeginDrag={Keyboard.dismiss}
          scrollEventThrottle={16}
          ref={listRef}
          renderItem={renderMessageItem}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {isLoading ? (
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      ) : null}

      {errorText.length > 0 ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
};

// `styles` defines the dark transcript layout used by the message list component.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    flexGrow: 1,
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 28,
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
  loadingRow: {
    backgroundColor: '#0b0f14',
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 8,
  },
  loadingText: {
    color: '#93c5fd',
    fontSize: 13,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
});
