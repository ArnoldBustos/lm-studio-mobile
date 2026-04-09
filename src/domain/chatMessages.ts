import {
  ChatMessage,
  ChatMessageStatus,
  ChatRole,
} from '../types/chat';
import {
  ChatContentPart,
  createChatContentSnapshot,
  createChatContentSnapshotFromParts,
} from './chatContent';

// `createMessageId` generates lightweight identifiers for transcript messages built from canonical message helpers.
const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `CreateChatMessageFromPartsInput` describes the canonical message inputs used to build a full `ChatMessage` record with compatibility fields.
type CreateChatMessageFromPartsInput = {
  id?: string;
  role: ChatRole;
  contentParts: ChatContentPart[];
  responseId: string | null;
  status: ChatMessageStatus;
};

// `CreateChatMessageFromTextInput` describes the text-plus-attachments inputs still used by current draft-driven message creation paths.
type CreateChatMessageFromTextInput = {
  id?: string;
  role: ChatRole;
  text: string;
  attachments: ChatMessage['attachments'];
  responseId: string | null;
  status: ChatMessageStatus;
};

// `createChatMessageFromParts` builds a full `ChatMessage` from canonical content parts and derives compatibility fields automatically.
export const createChatMessageFromParts = ({
  id,
  role,
  contentParts,
  responseId,
  status,
}: CreateChatMessageFromPartsInput): ChatMessage => {
  // `messageSnapshot` stores the compatibility text and attachments derived from canonical content parts for the returned message object.
  const messageSnapshot = createChatContentSnapshotFromParts(contentParts);

  return {
    attachments: messageSnapshot.attachments,
    content: messageSnapshot.text,
    contentParts: messageSnapshot.parts,
    id: typeof id === 'string' && id.length > 0 ? id : createMessageId(),
    responseId,
    role,
    status,
  };
};

// `createChatMessageFromText` builds a full `ChatMessage` from text plus attachments by first creating canonical content parts.
export const createChatMessageFromText = ({
  id,
  role,
  text,
  attachments,
  responseId,
  status,
}: CreateChatMessageFromTextInput): ChatMessage => {
  // `messageSnapshot` stores the canonical content parts and compatibility fields derived from text plus attachments for the returned message object.
  const messageSnapshot = createChatContentSnapshot(text, attachments);

  return createChatMessageFromParts({
    contentParts: messageSnapshot.parts,
    id,
    responseId,
    role,
    status,
  });
};

// `updateChatMessageStatus` rebuilds one message with a new status while keeping canonical content parts as the source of truth.
export const updateChatMessageStatus = (
  message: ChatMessage,
  status: ChatMessageStatus
): ChatMessage =>
  createChatMessageFromParts({
    contentParts: message.contentParts,
    id: message.id,
    responseId: message.responseId,
    role: message.role,
    status,
  });

// `updateChatMessageContentParts` rebuilds one message after canonical content changes while preserving id, role, response id, and status.
export const updateChatMessageContentParts = (
  message: ChatMessage,
  contentParts: ChatContentPart[]
): ChatMessage =>
  createChatMessageFromParts({
    contentParts,
    id: message.id,
    responseId: message.responseId,
    role: message.role,
    status: message.status,
  });
