import React from 'react';

import { connectToLmStudio, sendChatMessage } from '../api/lmStudio';
import {
  ChatMessage,
  ConnectionState,
  ModelOption,
  ServerSettings,
} from '../types/chat';

// `createId` generates a lightweight local identifier for newly created transcript messages.
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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

  // `sendMessage` appends a user message, sends the latest input, and appends the assistant reply.
  const sendMessage = async () => {
    // `trimmedMessage` stores the validated draft text before it is added to the transcript.
    const trimmedMessage = draftMessage.trim();

    if (trimmedMessage.length === 0 || settings.model.trim().length === 0 || isSending) {
      return;
    }

    // `userMessage` stores the new transcript item created from the current draft input.
    const userMessage: ChatMessage = {
      content: trimmedMessage,
      id: createId(),
      role: 'user',
    };
    // `nextMessages` stores the optimistic transcript shown in the UI before the server reply returns.
    const nextMessages = messages.concat(userMessage);

    setDraftMessage('');
    setChatError('');
    setMessages(nextMessages);
    setIsSending(true);

    try {
      // `result` stores the assistant reply returned by the LM Studio chat transport module.
      const result = await sendChatMessage(settings, trimmedMessage, previousResponseId);

      setMessages((currentMessages) => currentMessages.concat(result.assistantMessage));
      setPreviousResponseId(result.responseId);
    } catch (error) {
      if (error instanceof Error) {
        setChatError(error.message);
      } else {
        setChatError('Unable to send message.');
      }
    } finally {
      setIsSending(false);
    }
  };

  // `clearChat` removes all transcript items and clears chat-specific error text.
  const clearChat = () => {
    setMessages([]);
    setChatError('');
    setPreviousResponseId(null);
  };

  // `canSend` exposes the UI-ready send state derived from the current draft, model, and loading state.
  const canSend =
    connectionState === 'connected' &&
    !isSending &&
    settings.model.trim().length > 0 &&
    draftMessage.trim().length > 0;

  return {
    canSend,
    chatError,
    clearChat,
    connect,
    connectionError,
    connectionState,
    draftMessage,
    isFetchingModels,
    isSending,
    messages,
    modelError,
    models,
    sendMessage,
    setBaseUrl,
    setBearerToken,
    setDraftMessage,
    setModel,
    settings,
  };
};
