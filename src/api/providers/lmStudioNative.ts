import { getAttachmentsFromContentParts, getTextFromContentParts } from '../../domain/chatContent';
import {
  ChatAttachment,
  FetchModelsResult,
  ModelOption,
  SendChatResult,
  SendMessageContent,
  ServerSettings,
} from '../../types/chat';
import { ChatProviderAdapter, ChatProviderSendRequest } from './types';

// `createId` generates a lightweight local identifier for assistant transcript messages created by the native LM Studio provider.
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `normalizeBaseUrl` trims whitespace and removes trailing slashes before native LM Studio endpoint construction.
export const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '');

// `buildModelsEndpoint` constructs the native LM Studio models endpoint used by the settings UI and provider fetch logic.
export const buildModelsEndpoint = (baseUrl: string) => `${normalizeBaseUrl(baseUrl)}/api/v1/models`;

// `LmStudioModelRecord` describes one native LM Studio model record used by model list parsing.
type LmStudioModelRecord = {
  key: string;
  type?: string;
  display_name?: string;
};

// `LmStudioChatOutputRecord` describes one native LM Studio chat output item used by response parsing.
type LmStudioChatOutputRecord = {
  type?: string;
  content?: string;
};

// `LmStudioChatTextInputRecord` describes one native LM Studio text item built from canonical content blocks.
type LmStudioChatTextInputRecord = {
  type: 'text';
  content: string;
};

// `LmStudioChatImageInputRecord` describes one native LM Studio image item built from canonical content blocks.
type LmStudioChatImageInputRecord = {
  type: 'image';
  data_url: string;
};

// `LmStudioChatResponseRecord` describes the native LM Studio chat response used by defensive parsing.
type LmStudioChatResponseRecord = {
  output?: LmStudioChatOutputRecord[];
  response_id?: string;
};

// `LmStudioChatInputRecord` describes the native LM Studio multimodal input value accepted by `/api/v1/chat`.
type LmStudioChatInputRecord =
  | string
  | (LmStudioChatTextInputRecord | LmStudioChatImageInputRecord)[];

// `LmStudioChatRequestRecord` describes the native LM Studio chat request body sent by the provider adapter.
type LmStudioChatRequestRecord = {
  input: LmStudioChatInputRecord;
  model: string;
  previous_response_id?: string;
};

// `buildHeaders` creates request headers shared by the native LM Studio models and chat endpoints.
const buildHeaders = (settings: ServerSettings) => {
  // `headers` stores the fetch headers shared across the native LM Studio transport.
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (settings.bearerToken.trim().length > 0) {
    headers.Authorization = `Bearer ${settings.bearerToken.trim()}`;
  }

  return headers;
};

// `readErrorText` extracts a readable message from failed native LM Studio responses for chat and model UI errors.
const readErrorText = async (response: Response) => {
  try {
    // `payload` stores any JSON error body returned by the native LM Studio server.
    const payload = await response.json();

    if (payload && typeof payload.error === 'string') {
      return payload.error;
    }

    if (payload && payload.error && typeof payload.error.message === 'string') {
      return payload.error.message;
    }

    if (payload && typeof payload.message === 'string') {
      return payload.message;
    }
  } catch {
    // `error` is intentionally ignored because some LM Studio responses are plain text or empty.
  }

  try {
    // `fallbackText` stores a text response body when JSON parsing is not available.
    const fallbackText = await response.text();

    if (fallbackText.trim().length > 0) {
      return fallbackText.trim();
    }
  } catch {
    // `error` is intentionally ignored because the HTTP status line is still usable.
  }

  return `Request failed with status ${response.status}.`;
};

// `isSelectableChatModel` keeps likely chat-capable models and filters out embedding entries from the native LM Studio payload.
const isSelectableChatModel = (modelRecord: LmStudioModelRecord) => {
  if (typeof modelRecord.type === 'string') {
    return modelRecord.type === 'llm' || modelRecord.type === 'vlm';
  }

  if (typeof modelRecord.key === 'string' && modelRecord.key.toLowerCase().includes('embed')) {
    return false;
  }

  return true;
};

// `inferVisionCapability` estimates image support from native LM Studio model metadata because explicit capability flags are not yet exposed.
const inferVisionCapability = (modelRecord: LmStudioModelRecord) => {
  if (modelRecord.type === 'vlm') {
    return true;
  }

  // `combinedLabel` stores the normalized model id and display label used by the native capability heuristic.
  const combinedLabel = `${modelRecord.key} ${modelRecord.display_name || ''}`.toLowerCase();

  return (
    combinedLabel.includes('vision') ||
    combinedLabel.includes('llava') ||
    combinedLabel.includes('bakllava') ||
    combinedLabel.includes('pixtral') ||
    combinedLabel.includes('internvl') ||
    combinedLabel.includes('minicpm-v') ||
    combinedLabel.includes('qwen-vl') ||
    combinedLabel.includes('qwen2-vl') ||
    combinedLabel.includes('qwen2.5-vl') ||
    combinedLabel.includes('gemma-3') ||
    combinedLabel.includes('molmo') ||
    combinedLabel.includes('phi-3-vision') ||
    combinedLabel.includes('phi-4-multimodal') ||
    combinedLabel.includes('llama-3.2-vision') ||
    combinedLabel.includes('vl-')
  );
};

// `mapModels` converts the native LM Studio models payload into the shared model option list consumed by the settings UI.
const mapModels = (data: unknown): ModelOption[] => {
  if (!data || typeof data !== 'object') {
    throw new Error('Model response was not an object.');
  }

  if (!('models' in data) || !Array.isArray(data.models)) {
    throw new Error('Model response did not include a models array.');
  }

  return data.models
    .map((item) => {
      if (!item || typeof item !== 'object' || !('key' in item) || typeof item.key !== 'string') {
        return null;
      }

      // `modelRecord` stores the narrowed native LM Studio model row used for filtering and capability inference.
      const modelRecord: LmStudioModelRecord = item;

      if (!isSelectableChatModel(modelRecord)) {
        return null;
      }

      return {
        id: modelRecord.key,
        isVisionCapable: inferVisionCapability(modelRecord),
        label:
          typeof modelRecord.display_name === 'string' && modelRecord.display_name.trim().length > 0
            ? modelRecord.display_name
            : modelRecord.key,
      };
    })
    .filter((item): item is ModelOption => item !== null);
};

// `extractAssistantMessage` reads the assistant text and response id returned by the native LM Studio chat endpoint.
const extractAssistantMessage = (data: unknown) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Chat response was not an object.');
  }

  // `responseRecord` stores the narrowed native LM Studio response used for output parsing.
  const responseRecord: LmStudioChatResponseRecord = data;

  if (!Array.isArray(responseRecord.output) || responseRecord.output.length === 0) {
    throw new Error('Chat response did not include any output items.');
  }

  // `messageOutput` stores the first text output item returned by the native chat endpoint.
  const messageOutput = responseRecord.output.find((outputItem) => {
    if (!outputItem || typeof outputItem !== 'object') {
      return false;
    }

    return outputItem.type === 'message' && typeof outputItem.content === 'string';
  });

  if (!messageOutput || typeof messageOutput.content !== 'string') {
    throw new Error('Chat response did not include a text message output.');
  }

  return {
    content: messageOutput.content.trim(),
    responseId: typeof responseRecord.response_id === 'string' ? responseRecord.response_id : null,
  };
};

// `buildImageDataUrl` converts one normalized image attachment into the base64 data URL expected by the native LM Studio image input format.
const buildImageDataUrl = (attachment: ChatAttachment) =>
  `data:${attachment.mimeType};base64,${attachment.base64Data}`;

// `buildChatInputFromContent` formats canonical content blocks into the native LM Studio `/api/v1/chat` input payload.
const buildChatInputFromContent = (content: SendMessageContent): LmStudioChatInputRecord => {
  // `textContent` stores the derived text view produced from canonical content blocks for the native LM Studio transport.
  const textContent = getTextFromContentParts(content.parts).trim();
  // `imageAttachments` stores the derived image attachment list produced from canonical content blocks for the native LM Studio transport.
  const imageAttachments = getAttachmentsFromContentParts(content.parts);

  if (imageAttachments.length === 0) {
    return textContent;
  }

  // `parts` stores the native LM Studio multimodal input array built from canonical content blocks.
  const parts: (LmStudioChatTextInputRecord | LmStudioChatImageInputRecord)[] = [];

  if (textContent.length > 0) {
    parts.push({
      type: 'text',
      content: textContent,
    });
  }

  imageAttachments.forEach((attachment) => {
    parts.push({
      type: 'image',
      data_url: buildImageDataUrl(attachment),
    });
  });

  return parts;
};

// `fetchNativeModels` loads the available models from the native LM Studio models endpoint through the provider adapter seam.
const fetchNativeModels = async (settings: ServerSettings): Promise<FetchModelsResult> => {
  // `baseUrl` stores the normalized base URL used for the native models endpoint call.
  const baseUrl = normalizeBaseUrl(settings.baseUrl);

  if (baseUrl.length === 0) {
    throw new Error('Enter a base URL before fetching models.');
  }

  // `endpoint` stores the full URL for the native LM Studio models endpoint.
  const endpoint = buildModelsEndpoint(baseUrl);

  console.log('[lmStudio] fetchModels endpoint:', endpoint);
  console.log('[lmStudio] fetchModels starting');

  try {
    // `response` stores the network response from the native models request.
    const response = await fetch(endpoint, {
      headers: buildHeaders(settings),
      method: 'GET',
    });

    console.log('[lmStudio] fetchModels response status:', response.status);

    if (!response.ok) {
      throw new Error(await readErrorText(response));
    }

    // `data` stores the parsed JSON payload returned by the native models request.
    const data = await response.json();

    return {
      models: mapModels(data),
    };
  } catch (error) {
    // `errorText` stores the thrown error text for temporary native model fetch diagnostics.
    const errorText = error instanceof Error ? error.stack || error.message : String(error);

    console.log('[lmStudio] fetchModels error:', errorText);
    throw error;
  }
};

// `sendNativeMessage` posts canonical outgoing content to the native LM Studio chat endpoint and maps the response into shared chat state.
const sendNativeMessage = async ({
  settings,
  content,
  previousResponseId,
}: ChatProviderSendRequest): Promise<SendChatResult> => {
  // `baseUrl` stores the normalized base URL used for the native chat call.
  const baseUrl = normalizeBaseUrl(settings.baseUrl);
  // `textContent` stores the derived text view used to validate canonical outgoing content.
  const textContent = getTextFromContentParts(content.parts).trim();
  // `imageAttachments` stores the derived image attachments used to validate canonical outgoing content.
  const imageAttachments = getAttachmentsFromContentParts(content.parts);

  if (baseUrl.length === 0) {
    throw new Error('Enter a base URL before sending a message.');
  }

  if (settings.model.trim().length === 0) {
    throw new Error('Choose a model before sending a message.');
  }

  if (textContent.length === 0 && imageAttachments.length === 0) {
    throw new Error('Enter a message or attach an image before sending.');
  }

  // `endpoint` stores the full URL for the native LM Studio chat endpoint.
  const endpoint = `${baseUrl}/api/v1/chat`;
  // `payload` stores the native LM Studio request body derived from canonical content blocks.
  const payload: LmStudioChatRequestRecord = {
    input: buildChatInputFromContent(content),
    model: settings.model.trim(),
  };

  if (typeof previousResponseId === 'string' && previousResponseId.length > 0) {
    payload.previous_response_id = previousResponseId;
  }

  // `response` stores the network response from the native LM Studio chat request.
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: buildHeaders(settings),
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readErrorText(response));
  }

  // `data` stores the parsed JSON payload returned by the native LM Studio chat request.
  const data = await response.json();
  // `assistantResult` stores the assistant text and optional response id extracted from the native chat response.
  const assistantResult = extractAssistantMessage(data);

  return {
    assistantMessage: {
      attachments: [],
      content: assistantResult.content,
      contentParts: [
        {
          id: createId(),
          text: assistantResult.content,
          type: 'text',
        },
      ],
      id: createId(),
      responseId: assistantResult.responseId,
      role: 'assistant',
      status: 'sent',
    },
    responseId: assistantResult.responseId,
  };
};

// `lmStudioNativeProvider` exposes the native LM Studio provider adapter used by the current chat hook.
export const lmStudioNativeProvider: ChatProviderAdapter = {
  fetchModels: fetchNativeModels,
  sendMessage: sendNativeMessage,
};
