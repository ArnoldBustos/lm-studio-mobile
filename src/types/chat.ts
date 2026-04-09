import type { ChatContentPart } from '../domain/chatContent';

// `ChatRole` defines the supported LM Studio chat roles used across transport and UI layers.
export type ChatRole = 'system' | 'user' | 'assistant';

// `ChatAttachment` represents one local image attachment that can be previewed in the UI and sent to LM Studio vision models.
export type ChatAttachment = {
  id: string;
  type: 'image';
  uri: string;
  mimeType: string;
  fileName: string;
  width: number;
  height: number;
  base64Data: string;
};

// `ChatMessageStatus` defines the lightweight send lifecycle tracked for each transcript message in local chat state.
export type ChatMessageStatus = 'pending' | 'sent' | 'failed';

// `ConnectionState` defines the connection lifecycle shown by the header and managed by the chat hook.
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

// `ChatMessage` represents one transcript item whose `contentParts` are canonical while `content` and `attachments` remain transitional compatibility output for older consumers.
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  contentParts: ChatContentPart[];
  attachments: ChatAttachment[];
  responseId: string | null;
  status: ChatMessageStatus;
};

// `ServerSettings` stores the connection settings collected by the server settings form.
export type ServerSettings = {
  baseUrl: string;
  bearerToken: string;
  model: string;
};

// `ModelOption` represents one model entry returned from the LM Studio models endpoint.
export type ModelOption = {
  id: string;
  label: string;
  isVisionCapable: boolean;
};

// `FetchModelsResult` groups the parsed model list returned by the API module.
export type FetchModelsResult = {
  models: ModelOption[];
};

// `SendMessageContent` groups the canonical content blocks sent through provider adapters without assuming one transport payload shape.
export type SendMessageContent = {
  parts: ChatContentPart[];
};

// `SendChatResult` groups the assistant reply and native response id returned by the API module.
export type SendChatResult = {
  assistantMessage: ChatMessage;
  responseId: string | null;
};
