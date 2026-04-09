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

// `ConnectionState` defines the connection lifecycle shown by the header and managed by the chat hook.
export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

// `ChatMessage` represents one transcript item shared between the hook, API formatter, and UI.
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  attachments: ChatAttachment[];
  responseId: string | null;
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

// `SendChatInput` groups the outgoing text and optional image attachment sent through the LM Studio chat transport.
export type SendChatInput = {
  text: string;
  attachment: ChatAttachment | null;
};

// `SendChatResult` groups the assistant reply and native response id returned by the API module.
export type SendChatResult = {
  assistantMessage: ChatMessage;
  responseId: string | null;
};
