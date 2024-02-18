export interface RESTXblmessageInboxResponse {
  folder: string;
  totalCount: number;
  unreadCount: number;
  conversations: Conversation[];
}

export interface Conversation {
  timestamp: string;
  networkId: string;
  type: string;
  conversationId: string;
  voiceId: string;
  participants: string[];
  readHorizon: string;
  deleteHorizon: string;
  isRead: boolean;
  muted: boolean;
  folder: string;
  lastMessage: Message;
}

export interface Message {
  contentPayload: ContentPayload;
  timestamp: string;
  lastUpdateTimestamp: string;
  type: string;
  networkId: string;
  conversationType: string;
  conversationId: string;
  owner?: number;
  sender: string;
  messageId: string;
  clock: string;
  isDeleted: boolean;
  isServerUpdated: boolean;
  recipientFilter?: number[];
}

export interface ContentPayload {
  content: Content;
}

export interface Content {
  parts: Part[];
}

export interface Part {
  text?: string;
  xuid?: string;
  contentType: string;
  version: number;
  unsuitableFor?: string[];
  locator?: string;
  isReply?: boolean;
  buttonText?: string;
  appUri?: null | string;
  webUri?: null | string;
  voiceAttachmentId?: string;
  duration?: number;
  attachmentId?: string;
  filetype?: string;
  sizeInBytes?: number;
  hash?: string;
  height?: number;
  width?: number;
  downloadUri?: string;
  unsuitableForSafetyRatings?: any[];
}
