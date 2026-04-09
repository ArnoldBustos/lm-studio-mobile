import { FetchModelsResult, SendChatResult, SendMessageContent, ServerSettings } from '../../types/chat';

// `ChatProviderSendRequest` groups canonical outgoing content with connection context for provider adapters.
export type ChatProviderSendRequest = {
  settings: ServerSettings;
  content: SendMessageContent;
  previousResponseId: string | null;
};

// `ChatProviderAdapter` defines the minimal provider seam used by the chat hook while the app only ships the native LM Studio transport.
export type ChatProviderAdapter = {
  fetchModels: (settings: ServerSettings) => Promise<FetchModelsResult>;
  sendMessage: (request: ChatProviderSendRequest) => Promise<SendChatResult>;
};
