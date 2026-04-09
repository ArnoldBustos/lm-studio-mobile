import {
  ChatAttachment,
  FetchModelsResult,
  ModelOption,
  SendChatInput,
  SendChatResult,
  ServerSettings,
} from '../types/chat';

// `createId` generates a lightweight local identifier for message list rendering and state updates.
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `normalizeBaseUrl` trims whitespace and removes trailing slashes before endpoint construction.
export const normalizeBaseUrl = (baseUrl: string) => baseUrl.trim().replace(/\/+$/, '');

// `buildModelsEndpoint` constructs the exact native LM Studio models endpoint used by debug UI and transport.
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

// `LmStudioChatTextInputRecord` describes one text input item sent to the native LM Studio chat endpoint.
type LmStudioChatTextInputRecord = {
  type: 'text';
  content: string;
};

// `LmStudioChatImageInputRecord` describes one image input item sent to the native LM Studio chat endpoint.
type LmStudioChatImageInputRecord = {
  type: 'image';
  data_url: string;
};

// `LmStudioChatResponseRecord` describes the native LM Studio chat response used by defensive parsing.
type LmStudioChatResponseRecord = {
  output?: LmStudioChatOutputRecord[];
  response_id?: string;
};

// `LmStudioChatInputRecord` describes the supported native chat input value accepted by LM Studio.
type LmStudioChatInputRecord =
  | string
  | (LmStudioChatTextInputRecord | LmStudioChatImageInputRecord)[];

// `LmStudioChatRequestRecord` describes the native LM Studio chat request body sent by the transport layer.
type LmStudioChatRequestRecord = {
  input: LmStudioChatInputRecord;
  model: string;
  previous_response_id?: string;
};

// `buildHeaders` creates request headers and only attaches authorization when a bearer token exists.
const buildHeaders = (settings: ServerSettings) => {
  // `headers` stores the fetch headers shared by both LM Studio endpoints.
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };

  if (settings.bearerToken.trim().length > 0) {
    headers.Authorization = `Bearer ${settings.bearerToken.trim()}`;
  }

  return headers;
};

// `readErrorText` extracts a readable message from failed HTTP responses for UI display.
const readErrorText = async (response: Response) => {
  try {
    // `payload` stores any JSON error body returned by the LM Studio server.
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
    // `error` is intentionally ignored because some responses are plain text or empty.
  }

  try {
    // `fallbackText` stores a text response body when JSON parsing is not available.
    const fallbackText = await response.text();

    if (fallbackText.trim().length > 0) {
      return fallbackText.trim();
    }
  } catch {
    // `error` is intentionally ignored because the status line is still usable.
  }

  return `Request failed with status ${response.status}.`;
};

// `isSelectableChatModel` keeps likely chat-capable models and filters out embedding entries when possible.
const isSelectableChatModel = (modelRecord: LmStudioModelRecord) => {
  if (typeof modelRecord.type === 'string') {
    return modelRecord.type === 'llm' || modelRecord.type === 'vlm';
  }

  if (typeof modelRecord.key === 'string' && modelRecord.key.toLowerCase().includes('embed')) {
    return false;
  }

  return true;
};

// `inferVisionCapability` estimates image support from the model id and label because the parsed models list does not expose explicit vision metadata.
const inferVisionCapability = (modelRecord: LmStudioModelRecord) => {
  if (modelRecord.type === 'vlm') {
    return true;
  }

  // `combinedLabel` stores the normalized model id and label used for capability heuristics.
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

// `mapModels` converts native LM Studio model payloads into UI-friendly model options.
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

      // `modelRecord` stores the narrowed LM Studio model row used for filtering and display mapping.
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

// `extractAssistantMessage` reads the assistant text and response id from a native LM Studio chat response.
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

// `buildImageDataUrl` converts one local image attachment into the base64 data URL expected by the native LM Studio image input format.
const buildImageDataUrl = (attachment: ChatAttachment) =>
  `data:${attachment.mimeType};base64,${attachment.base64Data}`;

// `buildChatInput` formats outgoing text and optional image input for the native LM Studio `/api/v1/chat` endpoint.
const buildChatInput = (input: SendChatInput): LmStudioChatInputRecord => {
  if (input.attachment === null) {
    return input.text;
  }

  // `parts` stores the ordered multimodal input array sent to LM Studio when an image is attached.
  const parts: (LmStudioChatTextInputRecord | LmStudioChatImageInputRecord)[] = [];

  if (input.text.length > 0) {
    parts.push({
      type: 'text',
      content: input.text,
    });
  }

  parts.push({
    type: 'image',
    data_url: buildImageDataUrl(input.attachment),
  });

  return parts;
};

// `fetchModels` loads the available models from LM Studio using the server settings form values.
export const fetchModels = async (settings: ServerSettings): Promise<FetchModelsResult> => {
  // `baseUrl` stores the normalized base URL used for the models endpoint call.
  const baseUrl = normalizeBaseUrl(settings.baseUrl);

  if (baseUrl.length === 0) {
    throw new Error('Enter a base URL before fetching models.');
  }

  // `endpoint` stores the full URL for the LM Studio models endpoint.
  const endpoint = buildModelsEndpoint(baseUrl);

  console.log('[lmStudio] fetchModels endpoint:', endpoint);
  console.log('[lmStudio] fetchModels starting');

  try {
    // `response` stores the network response from the models request.
    const response = await fetch(endpoint, {
      headers: buildHeaders(settings),
      method: 'GET',
    });

    console.log('[lmStudio] fetchModels response status:', response.status);

    if (!response.ok) {
      throw new Error(await readErrorText(response));
    }

    // `data` stores the parsed JSON payload returned by the models request.
    const data = await response.json();

    return {
      models: mapModels(data),
    };
  } catch (error) {
    // `errorText` stores the full thrown error text for temporary model fetch debugging.
    const errorText = error instanceof Error ? error.stack || error.message : String(error);

    console.log('[lmStudio] fetchModels error:', errorText);
    throw error;
  }
};

// `connectToLmStudio` verifies connectivity through the models endpoint and returns the available chat models.
export const connectToLmStudio = async (
  settings: ServerSettings
): Promise<FetchModelsResult> => fetchModels(settings);

// `sendChatMessage` posts one user input to native LM Studio chat and returns the parsed assistant reply.
export const sendChatMessage = async (
  settings: ServerSettings,
  input: SendChatInput,
  previousResponseId: string | null
): Promise<SendChatResult> => {
  // `baseUrl` stores the normalized base URL used for the native chat call.
  const baseUrl = normalizeBaseUrl(settings.baseUrl);

  if (baseUrl.length === 0) {
    throw new Error('Enter a base URL before sending a message.');
  }

  if (settings.model.trim().length === 0) {
    throw new Error('Choose a model before sending a message.');
  }

  if (input.text.trim().length === 0 && input.attachment === null) {
    throw new Error('Enter a message or attach an image before sending.');
  }

  // `endpoint` stores the full URL for the native LM Studio chat endpoint.
  const endpoint = `${baseUrl}/api/v1/chat`;
  // `payload` stores the request body expected by the native non-streaming chat endpoint.
  const payload: LmStudioChatRequestRecord = {
    input: buildChatInput({
      attachment: input.attachment,
      text: input.text.trim(),
    }),
    model: settings.model.trim(),
  };

  if (typeof previousResponseId === 'string' && previousResponseId.length > 0) {
    payload.previous_response_id = previousResponseId;
  }

  // `response` stores the network response from the native chat request.
  const response = await fetch(endpoint, {
    body: JSON.stringify(payload),
    headers: buildHeaders(settings),
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await readErrorText(response));
  }

  // `data` stores the parsed JSON payload returned by the native chat request.
  const data = await response.json();
  // `assistantResult` stores the assistant text and optional stateful response id extracted from the response.
  const assistantResult = extractAssistantMessage(data);

  return {
    assistantMessage: {
      attachments: [],
      content: assistantResult.content,
      id: createId(),
      role: 'assistant',
      responseId: assistantResult.responseId,
    },
    responseId: assistantResult.responseId,
  };
};
