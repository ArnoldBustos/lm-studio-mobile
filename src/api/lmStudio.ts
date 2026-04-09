import { FetchModelsResult, SendChatResult, SendMessageContent, ServerSettings } from '../types/chat';
import { buildModelsEndpoint, lmStudioNativeProvider, normalizeBaseUrl } from './providers/lmStudioNative';

// `fetchModels` loads the available models through the active native LM Studio provider adapter.
export const fetchModels = async (settings: ServerSettings): Promise<FetchModelsResult> =>
  lmStudioNativeProvider.fetchModels(settings);

// `connectToLmStudio` verifies connectivity through the active native LM Studio provider adapter.
export const connectToLmStudio = async (
  settings: ServerSettings
): Promise<FetchModelsResult> => fetchModels(settings);

// `sendChatMessage` posts canonical outgoing content through the active native LM Studio provider adapter.
export const sendChatMessage = async (
  settings: ServerSettings,
  content: SendMessageContent,
  previousResponseId: string | null
): Promise<SendChatResult> =>
  lmStudioNativeProvider.sendMessage({
    content,
    previousResponseId,
    settings,
  });

export { buildModelsEndpoint, normalizeBaseUrl };
