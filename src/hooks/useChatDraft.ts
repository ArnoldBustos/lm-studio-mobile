import React from 'react';

import { ChatAttachment } from '../types/chat';

// `UseChatDraftResult` describes the draft state and draft mutation helpers consumed by the root chat hook.
export type UseChatDraftResult = {
  draftMessage: string;
  draftAttachments: ChatAttachment[];
  setDraftMessage: (value: string) => void;
  addDraftAttachment: (attachment: ChatAttachment) => void;
  removeDraftAttachment: (attachmentId: string) => void;
  replaceDraft: (nextDraftMessage: string, nextDraftAttachments: ChatAttachment[]) => void;
  clearDraft: () => void;
};

// `useChatDraft` owns the unsent composer text and attachment collection used by the chat screen.
export const useChatDraft = (): UseChatDraftResult => {
  // `draftMessage` stores the current unsent user input shown in the chat composer.
  const [draftMessage, setDraftMessage] = React.useState('');
  // `draftAttachments` stores the normalized unsent attachments queued in the chat composer.
  const [draftAttachments, setDraftAttachments] = React.useState<ChatAttachment[]>([]);

  // `addDraftAttachment` appends one normalized attachment to the draft collection used by the composer and send flow.
  const addDraftAttachment = (attachment: ChatAttachment) => {
    setDraftAttachments((currentDraftAttachments) => currentDraftAttachments.concat(attachment));
  };

  // `removeDraftAttachment` removes one normalized attachment from the draft collection used by the composer and send flow.
  const removeDraftAttachment = (attachmentId: string) => {
    setDraftAttachments((currentDraftAttachments) =>
      currentDraftAttachments.filter((attachment) => attachment.id !== attachmentId)
    );
  };

  // `replaceDraft` replaces the current composer text and attachment collection together so session actions can restore draft state atomically.
  const replaceDraft = (nextDraftMessage: string, nextDraftAttachments: ChatAttachment[]) => {
    setDraftMessage(nextDraftMessage);
    setDraftAttachments(nextDraftAttachments);
  };

  // `clearDraft` resets the current composer text and attachment collection after chat lifecycle actions complete.
  const clearDraft = () => {
    replaceDraft('', []);
  };

  return {
    addDraftAttachment,
    clearDraft,
    draftAttachments,
    draftMessage,
    removeDraftAttachment,
    replaceDraft,
    setDraftMessage,
  };
};
