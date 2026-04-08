import React from 'react';
import * as Clipboard from 'expo-clipboard';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChatMessage } from '../types/chat';

// `MessageBubbleProps` defines the transcript item shown by the message list.
type MessageBubbleProps = {
  message: ChatMessage;
};

// `MessageBubble` renders one chat message and styles it by sender role for the transcript list.
export const MessageBubble = ({ message }: MessageBubbleProps) => {
  // `copyResetTimerRef` stores the timeout that clears temporary copy feedback after a long press copy action.
  const copyResetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // `isUserMessage` marks messages authored by the local user for alignment and color changes.
  const isUserMessage = message.role === 'user';
  // `isCopied` tracks temporary inline copy feedback shown after the message content is copied.
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => () => {
    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }
  }, []);

  // `handleLongPress` copies the full message content to the device clipboard and shows temporary feedback.
  const handleLongPress = async () => {
    await Clipboard.setStringAsync(message.content);
    setIsCopied(true);

    if (copyResetTimerRef.current) {
      clearTimeout(copyResetTimerRef.current);
    }

    copyResetTimerRef.current = setTimeout(() => {
      setIsCopied(false);
    }, 1200);
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
          {isCopied ? <Text style={styles.copiedLabel}>Copied</Text> : null}
        </View>
        <Text style={styles.content}>{message.content}</Text>
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
  copiedLabel: {
    color: '#bfdbfe',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    color: '#f5f7fa',
    fontSize: 15,
    lineHeight: 22,
  },
});
