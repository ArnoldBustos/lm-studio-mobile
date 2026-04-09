import React from 'react';
import * as Clipboard from 'expo-clipboard';

import { sendChatMessage } from '../api/lmStudio';
import { createChatContentSnapshot } from '../domain/chatContent';
import { ChatAttachment, ChatMessage, ServerSettings } from '../types/chat';

// `createMessageId` generates lightweight identifiers for optimistic transcript messages created inside the session hook.
const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `UseChatSessionArgs` describes the draft and connection values the session hook coordinates with when sending transcript turns.
type UseChatSessionArgs = {
  settings: ServerSettings;
  selectedModelSupportsImages: boolean;
  draftMessage: string;
  draftAttachments: ChatAttachment[];
  replaceDraft: (nextDraftMessage: string, nextDraftAttachments: ChatAttachment[]) => void;
  clearDraft: () => void;
};

// `UseChatSessionResult` describes the transcript state and session actions exposed back to the root chat hook.
export type UseChatSessionResult = {
  messages: ChatMessage[];
  isSending: boolean;
  chatError: string;
  editingMessageId: string | null;
  setChatError: (nextChatError: string) => void;
  clearChat: () => void;
  copyMessage: (message: ChatMessage) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  updateMessageContent: (messageId: string, nextContent: string) => void;
  rewindToMessage: (messageId: string) => void;
  startEditingMessage: (messageId: string) => void;
  cancelEditingMessage: () => void;
  retryAssistantMessage: (messageId: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  clearChatError: () => void;
};

// `useChatSession` owns transcript state, send lifecycle, retry flow, and provider send integration for the chat screen.
export const useChatSession = ({
  settings,
  selectedModelSupportsImages,
  draftMessage,
  draftAttachments,
  replaceDraft,
  clearDraft,
}: UseChatSessionArgs): UseChatSessionResult => {
  // `messages` stores the user and assistant transcript displayed by the chat history list.
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  // `isSending` tracks whether the session is waiting for the provider adapter to finish one send.
  const [isSending, setIsSending] = React.useState(false);
  // `chatError` stores readable errors related to message sending and transcript actions.
  const [chatError, setChatError] = React.useState('');
  // `previousResponseId` stores the LM Studio native response id used to continue server-side context across turns.
  const [previousResponseId, setPreviousResponseId] = React.useState<string | null>(null);
  // `editingMessageId` stores the user message currently being revised through the composer-edit flow.
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);

  // `clearChatError` clears the session-level chat error used by the transcript and composer UI.
  const clearChatError = () => {
    setChatError('');
  };

  // `findPreviousAssistantResponseId` returns the latest assistant response id that appears before a transcript index.
  const findPreviousAssistantResponseId = (messageIndex: number) => {
    let currentIndex = messageIndex - 1;

    while (currentIndex >= 0) {
      // `currentMessage` stores the transcript item inspected during the backward response-id scan.
      const currentMessage = messages[currentIndex];

      if (currentMessage.role === 'assistant' && typeof currentMessage.responseId === 'string') {
        return currentMessage.responseId;
      }

      currentIndex -= 1;
    }

    return null;
  };

  // `setMessageStatus` updates the local send lifecycle for one transcript item without changing its content fields.
  const setMessageStatus = (messageId: string, nextStatus: ChatMessage['status']) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        return {
          attachments: message.attachments,
          content: message.content,
          contentParts: message.contentParts,
          id: message.id,
          responseId: message.responseId,
          role: message.role,
          status: nextStatus,
        };
      })
    );
  };

  // `sendUserTurn` appends one user turn, requests the assistant reply, and updates the response chain state.
  const sendUserTurn = async (
    userMessage: ChatMessage,
    responseIdToUse: string | null,
    nextDraftMessage: string,
    nextDraftAttachments: ChatAttachment[],
    baseMessages: ChatMessage[]
  ) => {
    // `nextMessages` stores the optimistic transcript shown in the UI before the server reply returns.
    const nextMessages = baseMessages.concat(userMessage);

    replaceDraft(nextDraftMessage, nextDraftAttachments);
    setChatError('');
    setEditingMessageId(null);
    setMessages(nextMessages);
    setIsSending(true);

    try {
      // `result` stores the assistant reply returned by the active provider adapter.
      const result = await sendChatMessage(
        settings,
        {
          parts: userMessage.contentParts,
        },
        responseIdToUse
      );

      setMessageStatus(userMessage.id, 'sent');
      setMessages((currentMessages) => currentMessages.concat(result.assistantMessage));
      setPreviousResponseId(result.responseId);
    } catch (error) {
      setMessageStatus(userMessage.id, 'failed');

      if (error instanceof Error) {
        setChatError(error.message);
      } else {
        setChatError('Unable to send message.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // `sendMessage` appends a user message built from the current draft, sends it, and appends the assistant reply.
  const sendMessage = async () => {
    // `trimmedMessage` stores the validated draft text before it is added to the transcript.
    const trimmedMessage = draftMessage.trim();

    if (
      (trimmedMessage.length === 0 && draftAttachments.length === 0) ||
      settings.model.trim().length === 0 ||
      isSending
    ) {
      return;
    }

    if (draftAttachments.length > 0 && !selectedModelSupportsImages) {
      setChatError('The selected model does not appear to support image input.');
      return;
    }

    // `messageContent` stores the canonical content blocks and derived UI fields for the next optimistic user message.
    const messageContent = createChatContentSnapshot(trimmedMessage, draftAttachments);
    // `userMessage` stores the new transcript item created from the current draft input.
    const userMessage: ChatMessage = {
      attachments: messageContent.attachments,
      content: messageContent.text,
      contentParts: messageContent.parts,
      id: createMessageId(),
      role: 'user',
      responseId: null,
      status: 'pending',
    };

    await sendUserTurn(userMessage, previousResponseId, '', [], messages);
  };

  // `clearChat` removes all transcript items and clears the current draft and chat-specific error text.
  const clearChat = () => {
    setMessages([]);
    setChatError('');
    clearDraft();
    setEditingMessageId(null);
    setPreviousResponseId(null);
  };

  // `copyMessage` copies the selected transcript message content to the device clipboard.
  const copyMessage = async (message: ChatMessage) => {
    await Clipboard.setStringAsync(message.content);
  };

  // `findMessageIndex` returns the transcript index for the selected message id or `-1` when it is missing.
  const findMessageIndex = (messageId: string) =>
    messages.findIndex((message) => message.id === messageId);

  // `updateMessageContent` replaces one transcript message content locally so either role can be corrected without resending.
  const updateMessageContent = (messageId: string, nextContent: string) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        return {
          attachments: message.attachments,
          content: nextContent,
          contentParts: createChatContentSnapshot(nextContent, message.attachments).parts,
          id: message.id,
          responseId: message.responseId,
          role: message.role,
          status: message.status,
        };
      })
    );
    setChatError('');
  };

  // `deleteMessage` removes one transcript item locally and clears server response chaining for future sends.
  const deleteMessage = (messageId: string) => {
    setMessages((currentMessages) => currentMessages.filter((message) => message.id !== messageId));
    setChatError('');
    setPreviousResponseId(null);

    if (editingMessageId === messageId) {
      setEditingMessageId(null);
    }
  };

  // `rewindToMessage` truncates the transcript at the selected message and restores the prior response chain when available.
  const rewindToMessage = (messageId: string) => {
    const messageIndex = findMessageIndex(messageId);

    if (messageIndex < 0) {
      return;
    }

    setMessages((currentMessages) => currentMessages.slice(0, messageIndex));
    setChatError('');
    setEditingMessageId(null);
    setPreviousResponseId(findPreviousAssistantResponseId(messageIndex));
  };

  // `startEditingMessage` removes the selected user message and later messages, then loads its text and attachments back into the draft state.
  const startEditingMessage = (messageId: string) => {
    const messageIndex = findMessageIndex(messageId);

    if (messageIndex < 0) {
      return;
    }

    // `targetMessage` stores the selected transcript item moved back into the draft state for composer-based editing.
    const targetMessage = messages[messageIndex];

    if (targetMessage.role !== 'user') {
      return;
    }

    setMessages((currentMessages) => currentMessages.slice(0, messageIndex));
    replaceDraft(targetMessage.content, targetMessage.attachments);
    setChatError('');
    setEditingMessageId(messageId);
    setPreviousResponseId(findPreviousAssistantResponseId(messageIndex));
  };

  // `retryAssistantMessage` removes one assistant reply and later turns, then regenerates the selected reply from the preceding user turn.
  const retryAssistantMessage = async (messageId: string) => {
    // `assistantMessageIndex` stores the transcript location of the assistant reply being regenerated.
    const assistantMessageIndex = findMessageIndex(messageId);

    if (assistantMessageIndex < 1 || isSending) {
      return;
    }

    // `targetMessage` stores the selected transcript item used to validate that retry applies to an assistant reply.
    const targetMessage = messages[assistantMessageIndex];

    if (targetMessage.role !== 'assistant') {
      return;
    }

    // `previousMessage` stores the user turn immediately before the selected assistant reply.
    const previousMessage = messages[assistantMessageIndex - 1];

    if (previousMessage.role !== 'user') {
      setChatError('Retry is only available when an assistant reply follows a user message.');
      return;
    }

    // `baseMessages` stores the transcript kept before the retried user turn so the regenerated reply replaces that branch.
    const baseMessages = messages.slice(0, assistantMessageIndex - 1);
    // `responseIdToUse` stores the assistant response id from the turn before the retried user message.
    const responseIdToUse = findPreviousAssistantResponseId(assistantMessageIndex - 1);
    // `retriedMessageContent` stores fresh canonical content blocks for the regenerated user turn so retried messages keep independent part ids.
    const retriedMessageContent = createChatContentSnapshot(
      previousMessage.content,
      previousMessage.attachments
    );
    // `retriedUserMessage` stores a fresh copy of the selected user turn so the regenerated transcript keeps unique ids.
    const retriedUserMessage: ChatMessage = {
      attachments: retriedMessageContent.attachments,
      content: retriedMessageContent.text,
      contentParts: retriedMessageContent.parts,
      id: createMessageId(),
      role: 'user',
      responseId: null,
      status: 'pending',
    };

    await sendUserTurn(
      retriedUserMessage,
      responseIdToUse,
      draftMessage,
      draftAttachments,
      baseMessages
    );
  };

  // `cancelEditingMessage` exits composer-based edit mode without clearing the current draft state.
  const cancelEditingMessage = () => {
    setEditingMessageId(null);
  };

  return {
    cancelEditingMessage,
    chatError,
    clearChat,
    clearChatError,
    copyMessage,
    deleteMessage,
    editingMessageId,
    isSending,
    messages,
    retryAssistantMessage,
    rewindToMessage,
    sendMessage,
    setChatError,
    startEditingMessage,
    updateMessageContent,
  };
};
