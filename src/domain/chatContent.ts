import type { ChatAttachment } from '../types/chat';

// `createContentPartId` generates lightweight identifiers for canonical content parts used by message state and provider adapters.
const createContentPartId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// `ChatTextContentPart` represents one canonical text block shared between chat state and provider formatters.
export type ChatTextContentPart = {
  id: string;
  type: 'text';
  text: string;
};

// `ChatImageAttachmentContentPart` represents one canonical image block that points at a normalized chat attachment.
export type ChatImageAttachmentContentPart = {
  id: string;
  type: 'image_attachment';
  attachment: ChatAttachment;
};

// `ChatContentPart` defines the minimal canonical content blocks currently supported by the mobile chat domain.
export type ChatContentPart = ChatTextContentPart | ChatImageAttachmentContentPart;

// `ChatContentSnapshot` groups canonical content blocks with the derived text and attachment arrays still used by the current UI.
export type ChatContentSnapshot = {
  parts: ChatContentPart[];
  text: string;
  attachments: ChatAttachment[];
};

// `createTextContentPart` builds one canonical text block from message text for chat state and provider adapters.
export const createTextContentPart = (text: string): ChatTextContentPart => ({
  id: createContentPartId(),
  text,
  type: 'text',
});

// `createImageAttachmentContentPart` builds one canonical image block from a normalized attachment for chat state and provider adapters.
export const createImageAttachmentContentPart = (
  attachment: ChatAttachment
): ChatImageAttachmentContentPart => ({
  attachment,
  id: createContentPartId(),
  type: 'image_attachment',
});

// `getTextFromContentParts` derives the concatenated text view still consumed by the current chat UI from canonical content blocks.
export const getTextFromContentParts = (parts: ChatContentPart[]) =>
  parts
    .filter((part): part is ChatTextContentPart => part.type === 'text')
    .map((part) => part.text)
    .join('\n\n');

// `getEditableTextFromContentParts` derives the editable text value used by local transcript editing flows from canonical content blocks.
export const getEditableTextFromContentParts = (parts: ChatContentPart[]) =>
  getTextFromContentParts(parts);

// `getCopyableTextFromContentParts` derives the clipboard-ready text value used by local copy flows from canonical content blocks.
export const getCopyableTextFromContentParts = (parts: ChatContentPart[]) =>
  getTextFromContentParts(parts);

// `getAttachmentsFromContentParts` derives the attachment array still consumed by the current chat UI from canonical content blocks.
export const getAttachmentsFromContentParts = (parts: ChatContentPart[]) =>
  parts
    .filter((part): part is ChatImageAttachmentContentPart => part.type === 'image_attachment')
    .map((part) => part.attachment);

// `getFirstImageAttachmentFromContentParts` derives the first image attachment still shown by the current one-image chat UI from canonical content blocks.
export const getFirstImageAttachmentFromContentParts = (parts: ChatContentPart[]) => {
  // `imageAttachmentPart` stores the first canonical image block used by the current message renderer.
  const imageAttachmentPart =
    parts.find((part): part is ChatImageAttachmentContentPart => part.type === 'image_attachment') ||
    null;

  return imageAttachmentPart ? imageAttachmentPart.attachment : null;
};

// `getPreviewTextFromContentParts` derives the compact text preview used by current message surfaces from canonical content blocks.
export const getPreviewTextFromContentParts = (parts: ChatContentPart[]) => {
  // `textPreview` stores the concatenated text currently shown by transcript bubbles and action-sheet previews.
  const textPreview = getTextFromContentParts(parts);

  if (textPreview.length > 0) {
    return textPreview;
  }

  if (getFirstImageAttachmentFromContentParts(parts) !== null) {
    return 'Image attachment';
  }

  return '';
};

// `createChatContentSnapshotFromParts` rebuilds the compatibility text and attachment fields from canonical content blocks for transitional message state.
export const createChatContentSnapshotFromParts = (parts: ChatContentPart[]): ChatContentSnapshot => ({
  attachments: getAttachmentsFromContentParts(parts),
  parts,
  text: getTextFromContentParts(parts),
});

// `createChatContentSnapshot` builds canonical content blocks and the legacy derived fields from text plus attachments for the current single-screen chat flow.
export const createChatContentSnapshot = (
  text: string,
  attachments: ChatAttachment[]
): ChatContentSnapshot => {
  // `parts` stores the ordered canonical content blocks shared between message state and provider adapters.
  const parts: ChatContentPart[] = [];

  if (text.length > 0) {
    parts.push(createTextContentPart(text));
  }

  attachments.forEach((attachment) => {
    parts.push(createImageAttachmentContentPart(attachment));
  });

  return {
    attachments: getAttachmentsFromContentParts(parts),
    parts,
    text: getTextFromContentParts(parts),
  };
};
