import type { ImagePickerAsset } from 'expo-image-picker';

import type { ChatAttachment } from '../types/chat';

// `createAttachmentId` generates lightweight identifiers for normalized local attachments shared by draft and transcript state.
const createAttachmentId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `normalizePickerImageAsset` converts one picked Expo image asset into the app's normalized attachment shape used by draft and message content state.
export const normalizePickerImageAsset = (asset: ImagePickerAsset): ChatAttachment | null => {
  if (typeof asset.base64 !== 'string' || asset.base64.length === 0) {
    return null;
  }

  return {
    base64Data: asset.base64,
    fileName: typeof asset.fileName === 'string' && asset.fileName.length > 0 ? asset.fileName : 'image.jpg',
    height: asset.height,
    id: createAttachmentId(),
    mimeType: typeof asset.mimeType === 'string' && asset.mimeType.length > 0 ? asset.mimeType : 'image/jpeg',
    type: 'image',
    uri: asset.uri,
    width: asset.width,
  };
};
