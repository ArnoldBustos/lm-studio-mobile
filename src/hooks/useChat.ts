import React from 'react';
import * as ImagePicker from 'expo-image-picker';

import { normalizePickerImageAsset } from '../domain/attachments';
import { connectToLmStudio } from '../api/lmStudio';
import { useChatDraft } from './useChatDraft';
import { useChatSession } from './useChatSession';
import {
  ConnectionState,
  ModelOption,
  ServerSettings,
} from '../types/chat';

// `initialSettings` defines the starting connection values for the first app launch.
const initialSettings: ServerSettings = {
  baseUrl: 'http://192.168.2.115:1234',
  bearerToken: '',
  model: '',
};

// `useChat` composes connection state, draft state, and session state into the stable chat API consumed by the root screen.
export const useChat = () => {
  // `didAutoConnectRef` tracks whether the initial automatic connection attempt has already been performed.
  const didAutoConnectRef = React.useRef(false);
  // `settings` stores the server settings edited in the server settings section.
  const [settings, setSettings] = React.useState<ServerSettings>(initialSettings);
  // `models` stores the fetched model list returned by the LM Studio models endpoint.
  const [models, setModels] = React.useState<ModelOption[]>([]);
  // `isFetchingModels` tracks the loading state for the fetch models button.
  const [isFetchingModels, setIsFetchingModels] = React.useState(false);
  // `connectionState` stores the high-level connection lifecycle shown by the header and settings section.
  const [connectionState, setConnectionState] = React.useState<ConnectionState>('idle');
  // `connectionError` stores readable errors from the latest connection attempt.
  const [connectionError, setConnectionError] = React.useState('');
  // `modelError` stores readable errors related to model discovery.
  const [modelError, setModelError] = React.useState('');
  // `isPickingImage` tracks the gallery picker lifecycle for the attach button state.
  const [isPickingImage, setIsPickingImage] = React.useState(false);
  // `draft` owns the unsent composer text and attachment collection used by the chat screen.
  const draft = useChatDraft();

  // `selectedModel` stores the full selected model metadata used for image support decisions.
  const selectedModel =
    settings.model.trim().length > 0
      ? models.find((modelOption) => modelOption.id === settings.model) || null
      : null;
  // `selectedModelSupportsImages` indicates whether the current model appears to support image input.
  const selectedModelSupportsImages = selectedModel ? selectedModel.isVisionCapable : false;
  // `session` owns transcript state, send lifecycle, and draft-aware session actions used by the chat screen.
  const session = useChatSession({
    clearDraft: draft.clearDraft,
    draftAttachments: draft.draftAttachments,
    draftMessage: draft.draftMessage,
    replaceDraft: draft.replaceDraft,
    selectedModelSupportsImages,
    settings,
  });
  // `pendingAttachment` preserves the existing single-attachment composer API by exposing the first queued draft attachment when present.
  const pendingAttachment =
    draft.draftAttachments.length > 0 ? draft.draftAttachments[0] : null;

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

  // `connect` verifies the server, fetches models, and updates the connection state shown by the chat UI.
  const connect = async () => {
    await connectWithSettings(settings);
  };

  // `removePendingAttachment` preserves the existing single-attachment composer API by removing the first queued draft attachment when present.
  const removePendingAttachment = () => {
    if (pendingAttachment === null) {
      return;
    }

    draft.removeDraftAttachment(pendingAttachment.id);
  };

  // `pickImageAttachment` opens the gallery picker, validates the selected image, and appends it to the draft attachment collection.
  const pickImageAttachment = async () => {
    if (isPickingImage) {
      return;
    }

    if (settings.model.trim().length === 0) {
      session.setChatError('Choose a model before attaching an image.');
      return;
    }

    if (!selectedModelSupportsImages) {
      session.setChatError('The selected model does not appear to support image input.');
      return;
    }

    if (draft.draftAttachments.length > 0) {
      return;
    }

    setIsPickingImage(true);

    try {
      // `permissionResult` stores the current gallery access permission response returned by Expo Image Picker.
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        throw new Error('Media library permission is required to attach an image.');
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

      // `selectedAsset` stores the first picked gallery image used for draft attachment state.
      const selectedAsset = pickerResult.assets[0];
      // `nextAttachment` stores the normalized chat attachment built from the picked image asset.
      const nextAttachment = normalizePickerImageAsset(selectedAsset);

      if (nextAttachment === null) {
        throw new Error('Unable to read the selected image data.');
      }

      draft.addDraftAttachment(nextAttachment);
      session.clearChatError();
    } catch (error) {
      if (error instanceof Error) {
        session.setChatError(error.message);
      } else {
        session.setChatError('Unable to pick an image.');
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  // `canSend` exposes the UI-ready send state derived from the current draft, model, and loading state.
  const canSend =
    connectionState === 'connected' &&
    !session.isSending &&
    settings.model.trim().length > 0 &&
    (draft.draftAttachments.length === 0 || selectedModelSupportsImages) &&
    (draft.draftMessage.trim().length > 0 || draft.draftAttachments.length > 0);

  return {
    canSend,
    chatError: session.chatError,
    clearChat: session.clearChat,
    connect,
    connectionError,
    connectionState,
    copyMessage: session.copyMessage,
    deleteMessage: session.deleteMessage,
    draftMessage: draft.draftMessage,
    editingMessageId: session.editingMessageId,
    isFetchingModels,
    isPickingImage,
    isSending: session.isSending,
    messages: session.messages,
    modelError,
    models,
    pendingAttachment,
    pickImageAttachment,
    removePendingAttachment,
    rewindToMessage: session.rewindToMessage,
    retryAssistantMessage: session.retryAssistantMessage,
    sendMessage: session.sendMessage,
    selectedModelSupportsImages,
    startEditingMessage: session.startEditingMessage,
    cancelEditingMessage: session.cancelEditingMessage,
    setBaseUrl,
    setBearerToken,
    setDraftMessage: draft.setDraftMessage,
    setModel,
    settings,
    updateMessageContent: session.updateMessageContent,
  };
};
