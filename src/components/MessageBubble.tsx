import React from 'react';
import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
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

// `MessageTextSegment` describes one inline text fragment plus the lightweight markdown styles to apply.
type MessageTextSegment = {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  isCode: boolean;
};

// `parseInlineMessageSegments` converts a plain message string into lightweight markdown-aware inline text segments.
const parseInlineMessageSegments = (value: string): MessageTextSegment[] => {
  // `segments` stores the ordered inline fragments that will be rendered inside one React Native text block.
  const segments: MessageTextSegment[] = [];
  // `currentIndex` stores the current parser cursor while scanning the source message string.
  let currentIndex = 0;
  // `activeBold` tracks whether subsequent characters should render with bold emphasis.
  let activeBold = false;
  // `activeItalic` tracks whether subsequent characters should render with italic emphasis.
  let activeItalic = false;
  // `activeCode` tracks whether subsequent characters should render with inline code styling.
  let activeCode = false;
  // `buffer` stores the current text run until the parser reaches a markdown delimiter boundary.
  let buffer = '';

  // `flushBuffer` commits the buffered text using the currently active inline style flags.
  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }

    segments.push({
      isBold: activeBold,
      isCode: activeCode,
      isItalic: activeItalic,
      text: buffer,
    });
    buffer = '';
  };

  while (currentIndex < value.length) {
    // `currentCharacter` stores the character currently being evaluated by the inline parser.
    const currentCharacter = value[currentIndex];
    // `nextCharacter` stores the next character so double-asterisk delimiters can be detected safely.
    const nextCharacter = currentIndex + 1 < value.length ? value[currentIndex + 1] : '';

    if (currentCharacter === '`') {
      flushBuffer();
      activeCode = !activeCode;
      currentIndex += 1;
      continue;
    }

    if (!activeCode && currentCharacter === '*' && nextCharacter === '*') {
      flushBuffer();
      activeBold = !activeBold;
      currentIndex += 2;
      continue;
    }

    if (!activeCode && currentCharacter === '*') {
      flushBuffer();
      activeItalic = !activeItalic;
      currentIndex += 1;
      continue;
    }

    buffer += currentCharacter;
    currentIndex += 1;
  }

  flushBuffer();

  return segments;
};

// `renderFormattedMessageText` renders plain or lightweight-markdown message content without leaking raw markdown markers.
const renderFormattedMessageText = (value: string): ReactNode => {
  // `segments` stores the parsed inline fragments used to build the nested text tree for one message bubble.
  const segments = parseInlineMessageSegments(value);

  return segments.map((segment, index) => {
    // `segmentStyles` stores the inline style list applied to one parsed text fragment.
    const segmentStyles: TextStyle[] = [styles.content];

    if (segment.isBold) {
      segmentStyles.push(styles.contentBold);
    }

    if (segment.isItalic) {
      segmentStyles.push(styles.contentItalic);
    }

    if (segment.isCode) {
      segmentStyles.push(styles.contentCode);
    }

    return (
      <Text key={`segment-${index}`} style={segmentStyles}>
        {segment.text}
      </Text>
    );
  });
};

// `MessageBubble` renders one chat message and styles it by sender role for the transcript list.
export const MessageBubble = ({ message, onOpenActions }: MessageBubbleProps) => {
  // `isUserMessage` marks messages authored by the local user for alignment and color changes.
  const isUserMessage = message.role === 'user';
  // `isFailedMessage` marks transcript rows that should show the lightweight failed-send treatment.
  const isFailedMessage = message.status === 'failed';
  // `isPendingMessage` marks transcript rows that should show the lightweight pending-send treatment.
  const isPendingMessage = message.status === 'pending';
  // `imageAttachment` stores the first canonical image block shown inline with the current one-image message bubble.
  const imageAttachment = getFirstImageAttachmentFromContentParts(message.contentParts);
  // `messageText` stores the canonical text content shown inside the current message bubble.
  const messageText = getTextFromContentParts(message.contentParts);
  // `statusLabel` stores the compact lifecycle text shown below messages that are still pending or failed.
  const statusLabel =
    isFailedMessage ? 'Failed to send' : isPendingMessage ? 'Sending...' : '';
  // `handleLongPress` forwards the pressed message to the higher-level action menu controller.
  const handleLongPress = () => {
    onOpenActions(message);
  };

  return (
    <View style={isUserMessage ? styles.rowUser : styles.rowAssistant}>
      <Pressable
        delayLongPress={220}
        onLongPress={handleLongPress}
        style={[
          styles.container,
          isUserMessage ? styles.containerUser : styles.containerAssistant,
          isFailedMessage ? styles.containerFailed : null,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.roleLabel}>{isUserMessage ? 'You' : 'Assistant'}</Text>
        </View>
        {imageAttachment ? (
          <Image contentFit="cover" source={{ uri: imageAttachment.uri }} style={styles.attachmentImage} />
        ) : null}
        {messageText.length > 0 ? (
          <Text style={styles.content}>
            {isUserMessage ? messageText : renderFormattedMessageText(messageText)}
          </Text>
        ) : null}
        {statusLabel.length > 0 ? (
          <Text style={isFailedMessage ? styles.statusLabelFailed : styles.statusLabelPending}>
            {statusLabel}
          </Text>
        ) : null}
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
  containerFailed: {
    borderColor: '#f87171',
    borderWidth: 1,
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
  contentBold: {
    fontWeight: '700',
  },
  contentItalic: {
    fontStyle: 'italic',
  },
  contentCode: {
    backgroundColor: '#0f1720',
    color: '#dbe4ee',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  statusLabelPending: {
    color: '#93c5fd',
    fontSize: 12,
    marginTop: 2,
  },
  statusLabelFailed: {
    color: '#fca5a5',
    fontSize: 12,
    marginTop: 2,
  },
});
