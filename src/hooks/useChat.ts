import { useState } from 'react';

import { fetchModels as fetchModelsRequest, sendChatMessage } from '../api/lmStudio';
import { ChatMessage, ModelOption, ServerSettings } from '../types/chat';

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
  // `settings` stores the server settings edited in the server settings section.
  const [settings, setSettings] = useState<ServerSettings>(initialSettings);
  // `models` stores the fetched model list returned by the LM Studio models endpoint.
  const [models, setModels] = useState<ModelOption[]>([]);
  // `messages` stores the user and assistant transcript displayed by the message list.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // `draftMessage` stores the current unsent user input shown in the chat input section.
  const [draftMessage, setDraftMessage] = useState('');
  // `isFetchingModels` tracks the loading state for the fetch models button.
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  // `isSending` tracks the loading state for the send button and transcript footer.
  const [isSending, setIsSending] = useState(false);
  // `modelError` stores readable errors related to model discovery.
  const [modelError, setModelError] = useState('');
  // `chatError` stores readable errors related to message sending.
  const [chatError, setChatError] = useState('');
  // `previousResponseId` stores the LM Studio native chat response id used to continue server-side context.
  const [previousResponseId, setPreviousResponseId] = useState<string | null>(null);

  // `setBaseUrl` updates only the base URL field used by the LM Studio transport layer.
  const setBaseUrl = (baseUrl: string) => {
    setSettings((currentSettings) => ({
      baseUrl,
      bearerToken: currentSettings.bearerToken,
      model: currentSettings.model,
    }));
  };

  // `setBearerToken` updates only the bearer token field used for authenticated requests.
  const setBearerToken = (bearerToken: string) => {
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

  // `fetchModels` loads model options and adopts the first model when none is currently selected.
  const fetchModels = async () => {
    setIsFetchingModels(true);
    setModelError('');
    console.log('[useChat] fetchModels baseUrl:', settings.baseUrl);

    try {
      // `result` stores the parsed model list returned by the transport module.
      const result = await fetchModelsRequest(settings);

      setModels(result.models);

      if (settings.model.trim().length === 0 && result.models.length > 0) {
        setSettings((currentSettings) => ({
          baseUrl: currentSettings.baseUrl,
          bearerToken: currentSettings.bearerToken,
          model: result.models[0].id,
        }));
      }
    } catch (error) {
      if (error instanceof Error) {
        setModelError(error.message);
      } else {
        setModelError('Unable to fetch models.');
      }
    } finally {
      setIsFetchingModels(false);
    }
  };

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
    !isSending && settings.model.trim().length > 0 && draftMessage.trim().length > 0;

  return {
    canSend,
    chatError,
    clearChat,
    draftMessage,
    fetchModels,
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
