import React from 'react';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';

import { createChatContentSnapshot } from '../domain/chatContent';
import { connectToLmStudio, sendChatMessage } from '../api/lmStudio';
import {
  ChatAttachment,
  ChatMessage,
  ConnectionState,
  ModelOption,
  ServerSettings,
} from '../types/chat';

// `createId` generates a lightweight local identifier for newly created transcript messages.
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `mapPickerAssetToAttachment` converts one picked Expo image asset into the app's local attachment shape.
const mapPickerAssetToAttachment = (asset: ImagePicker.ImagePickerAsset): ChatAttachment | null => {
  if (typeof asset.base64 !== 'string' || asset.base64.length === 0) {
    return null;
  }

  return {
    base64Data: asset.base64,
    fileName: typeof asset.fileName === 'string' && asset.fileName.length > 0 ? asset.fileName : 'image.jpg',
    height: asset.height,
    id: createId(),
    mimeType: typeof asset.mimeType === 'string' && asset.mimeType.length > 0 ? asset.mimeType : 'image/jpeg',
    type: 'image',
    uri: asset.uri,
    width: asset.width,
  };
};

// `initialSettings` defines the starting connection values for the first app launch.
const initialSettings: ServerSettings = {
  baseUrl: 'http://192.168.2.115:1234',
  bearerToken: '',
  model: '',
};

// `useChat` owns the chat transcript, request lifecycle, and server settings used by the root screen.
export const useChat = () => {
  // `didAutoConnectRef` tracks whether the initial automatic connection attempt has already been performed.
  const didAutoConnectRef = React.useRef(false);
  // `settings` stores the server settings edited in the server settings section.
  const [settings, setSettings] = React.useState<ServerSettings>(initialSettings);
  // `models` stores the fetched model list returned by the LM Studio models endpoint.
  const [models, setModels] = React.useState<ModelOption[]>([]);
  // `messages` stores the user and assistant transcript displayed by the message list.
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  // `draftMessage` stores the current unsent user input shown in the chat input section.
  const [draftMessage, setDraftMessage] = React.useState('');
  // `isFetchingModels` tracks the loading state for the fetch models button.
  const [isFetchingModels, setIsFetchingModels] = React.useState(false);
  // `isSending` tracks the loading state for the send button and transcript footer.
  const [isSending, setIsSending] = React.useState(false);
  // `connectionState` stores the high-level connection lifecycle shown by the header and settings section.
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('idle');
  // `connectionError` stores readable errors from the latest connection attempt.
  const [connectionError, setConnectionError] = React.useState('');
  // `modelError` stores readable errors related to model discovery.
  const [modelError, setModelError] = React.useState('');
  // `chatError` stores readable errors related to message sending.
  const [chatError, setChatError] = React.useState('');
  // `previousResponseId` stores the LM Studio native chat response id used to continue server-side context.
  const [previousResponseId, setPreviousResponseId] = React.useState<string | null>(null);
  // `editingMessageId` stores the user message currently being revised in the composer after an edit action.
  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  // `pendingAttachment` stores the single image queued in the composer before the next send.
  const [pendingAttachment, setPendingAttachment] = React.useState<ChatAttachment | null>(null);
  // `isPickingImage` tracks the gallery picker lifecycle for the attach button state.
  const [isPickingImage, setIsPickingImage] = React.useState(false);

  // `applyConnectionResult` stores fetched models and updates connection state after a successful connection attempt.
  const applyConnectionResult = (currentSettings: ServerSettings, modelsResult: ModelOption[]) => {
    setModels(modelsResult);
    setConnectionError('');
    setConnectionState('connected');
    setModelError('');

    if (currentSettings.model.trim().length === 0 && modelsResult.length > 0) {
      setSettings((previousSettings) => ({
        baseUrl: previousSettings.baseUrl,
        bearerToken: previousSettings.bearerToken,
        model: modelsResult[0].id,
      }));
    }
  };

  // `resetConnectionState` clears connection status after server settings that affect connectivity change.
  const resetConnectionState = () => {
    setConnectionState('idle');
    setConnectionError('');
    setModelError('');
    setModels([]);
  };

  // `setBaseUrl` updates only the base URL field used by the LM Studio transport layer.
  const setBaseUrl = (baseUrl: string) => {
    resetConnectionState();
    setSettings((currentSettings) => ({
      baseUrl,
      bearerToken: currentSettings.bearerToken,
      model: currentSettings.model,
    }));
  };

  // `setBearerToken` updates only the bearer token field used for authenticated requests.
  const setBearerToken = (bearerToken: string) => {
    resetConnectionState();
    setSettings((currentSettings) => ({
      baseUrl: currentSettings.baseUrl,
      bearerToken,
      model: currentSettings.model,
    }));
  };

  // `setModel` updates only the active model selection used by the send action.
  const setModel = (model: string) => {
    setSettings((currentSettings) => ({
      baseUrl: currentSettings.baseUrl,
      bearerToken: currentSettings.bearerToken,
      model,
    }));
  };

  // `connectWithSettings` verifies the server, fetches models, and updates connection state for a specific settings snapshot.
  const connectWithSettings = React.useCallback(async (currentSettings: ServerSettings) => {
    setIsFetchingModels(true);
    setModelError('');
    setConnectionError('');
    setConnectionState('connecting');
    console.log('[useChat] fetchModels baseUrl:', currentSettings.baseUrl);

    try {
      // `result` stores the parsed model list returned by the transport module.
      const result = await connectToLmStudio(currentSettings);

      applyConnectionResult(currentSettings, result.models);
    } catch (error) {
      if (error instanceof Error) {
        setConnectionError(error.message);
        setModelError(error.message);
      } else {
        setConnectionError('Unable to connect to LM Studio.');
        setModelError('Unable to fetch models.');
      }

      setConnectionState('error');
    } finally {
      setIsFetchingModels(false);
    }
  }, []);

  // `connect` verifies the server, fetches models, and updates the connection state shown by the chat UI.
  const connect = async () => {
    await connectWithSettings(settings);
  };

  // `selectedModel` stores the full selected model metadata used for image support decisions.
  const selectedModel =
    settings.model.trim().length > 0
      ? models.find((modelOption) => modelOption.id === settings.model) || null
      : null;
  // `selectedModelSupportsImages` indicates whether the current model appears to support image input.
  const selectedModelSupportsImages = selectedModel ? selectedModel.isVisionCapable : false;

  React.useEffect(() => {
    if (didAutoConnectRef.current) {
      return;
    }

    if (initialSettings.baseUrl.trim().length === 0) {
      return;
    }

    didAutoConnectRef.current = true;
    void connectWithSettings(initialSettings);
  }, [connectWithSettings]);

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
    nextAttachment: ChatAttachment | null,
    baseMessages: ChatMessage[]
  ) => {
    // `nextMessages` stores the optimistic transcript shown in the UI before the server reply returns.
    const nextMessages = baseMessages.concat(userMessage);

    setDraftMessage(nextDraftMessage);
    setChatError('');
    setEditingMessageId(null);
    setPendingAttachment(nextAttachment);
    setMessages(nextMessages);
    setIsSending(true);

    try {
      // `result` stores the assistant reply returned by the LM Studio chat transport module.
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

  // `sendMessage` appends a user message, sends the latest input, and appends the assistant reply.
  const sendMessage = async () => {
    // `trimmedMessage` stores the validated draft text before it is added to the transcript.
    const trimmedMessage = draftMessage.trim();
    // `attachmentToSend` stores the current pending image snapshot so send state can be cleared before the request runs.
    const attachmentToSend = pendingAttachment;

    if (
      (trimmedMessage.length === 0 && attachmentToSend === null) ||
      settings.model.trim().length === 0 ||
      isSending
    ) {
      return;
    }

    if (attachmentToSend !== null && !selectedModelSupportsImages) {
      setChatError('The selected model does not appear to support image input.');
      return;
    }

    // `attachmentsToSend` stores the current pending image as an attachment array so canonical content can stay transport-agnostic.
    const attachmentsToSend = attachmentToSend !== null ? [attachmentToSend] : [];
    // `messageContent` stores the canonical content blocks and derived UI fields for the next optimistic user message.
    const messageContent = createChatContentSnapshot(trimmedMessage, attachmentsToSend);

    // `userMessage` stores the new transcript item created from the current draft input.
    const userMessage: ChatMessage = {
      attachments: messageContent.attachments,
      content: messageContent.text,
      contentParts: messageContent.parts,
      id: createId(),
      role: 'user',
      responseId: null,
      status: 'pending',
    };

    await sendUserTurn(userMessage, previousResponseId, '', null, messages);
  };

  // `clearChat` removes all transcript items and clears chat-specific error text.
  const clearChat = () => {
    setMessages([]);
    setChatError('');
    setDraftMessage('');
    setEditingMessageId(null);
    setPendingAttachment(null);
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

  // `startEditingMessage` removes the selected user message and later messages, then loads its text into the composer.
  const startEditingMessage = (messageId: string) => {
    const messageIndex = findMessageIndex(messageId);

    if (messageIndex < 0) {
      return;
    }

    const targetMessage = messages[messageIndex];

    if (targetMessage.role !== 'user') {
      return;
    }

    setMessages((currentMessages) => currentMessages.slice(0, messageIndex));
    setDraftMessage(targetMessage.content);
    setChatError('');
    setEditingMessageId(messageId);
    setPendingAttachment(targetMessage.attachments.length > 0 ? targetMessage.attachments[0] : null);
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
      id: createId(),
      role: 'user',
      responseId: null,
      status: 'pending',
    };

    await sendUserTurn(
      retriedUserMessage,
      responseIdToUse,
      draftMessage,
      pendingAttachment,
      baseMessages
    );
  };

  // `cancelEditingMessage` exits edit mode without clearing the current composer text.
  const cancelEditingMessage = () => {
    setEditingMessageId(null);
  };

  // `removePendingAttachment` clears the current image queued in the composer.
  const removePendingAttachment = () => {
    setPendingAttachment(null);
  };

  // `pickImageAttachment` opens the gallery picker, validates the selected image, and stores it in the composer state.
  const pickImageAttachment = async () => {
    if (isPickingImage) {
      return;
    }

    if (settings.model.trim().length === 0) {
      setChatError('Choose a model before attaching an image.');
      return;
    }

    if (!selectedModelSupportsImages) {
      setChatError('The selected model does not appear to support image input.');
      return;
    }

    setIsPickingImage(true);

    try {
      // `permissionResult` stores the current gallery access permission response returned by Expo Image Picker.
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setChatError('Media library permission is required to attach an image.');
        return;
      }

      // `pickerResult` stores the image selection result returned by the native gallery picker UI.
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        base64: true,
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (pickerResult.canceled) {
        return;
      }

      // `selectedAsset` stores the first picked gallery image used for the pending attachment state.
      const selectedAsset = pickerResult.assets[0];
      // `nextAttachment` stores the normalized chat attachment built from the picked image asset.
      const nextAttachment = mapPickerAssetToAttachment(selectedAsset);

      if (nextAttachment === null) {
        setChatError('Unable to read the selected image data.');
        return;
      }

      setPendingAttachment(nextAttachment);
      setChatError('');
    } catch (error) {
      if (error instanceof Error) {
        setChatError(error.message);
      } else {
        setChatError('Unable to pick an image.');
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  // `canSend` exposes the UI-ready send state derived from the current draft, model, and loading state.
  const canSend =
    connectionState === 'connected' &&
    !isSending &&
    settings.model.trim().length > 0 &&
    (pendingAttachment === null || selectedModelSupportsImages) &&
    (draftMessage.trim().length > 0 || pendingAttachment !== null);

  return {
    canSend,
    chatError,
    clearChat,
    connect,
    connectionError,
    connectionState,
    copyMessage,
    deleteMessage,
    draftMessage,
    editingMessageId,
    isFetchingModels,
    isPickingImage,
    isSending,
    messages,
    modelError,
    models,
    pendingAttachment,
    pickImageAttachment,
    removePendingAttachment,
    rewindToMessage,
    retryAssistantMessage,
    sendMessage,
    selectedModelSupportsImages,
    startEditingMessage,
    cancelEditingMessage,
    setBaseUrl,
    setBearerToken,
    setDraftMessage,
    setModel,
    settings,
    updateMessageContent,
  };
};
