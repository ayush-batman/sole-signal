import type { FootwearAttributes } from "./taxonomy";

export type AttributeExtractionInput = {
  title: string;
  category?: string;
  imageUrls: string[];
  materialHash: string;
};

export type AttributeExtractionResult = {
  attributes: FootwearAttributes;
  confidence: number;
  modelVersion: string;
  promptVersion: string;
};

export interface AttributeModelProvider {
  readonly name: string;
  readonly enabled: boolean;
  extract(input: AttributeExtractionInput): Promise<AttributeExtractionResult>;
}

export type NotificationMessage = {
  workspaceId: string;
  recipient: string;
  title: string;
  body: string;
  evidenceUrl?: string;
};

export type NotificationResult = {
  delivered: boolean;
  providerMessageId?: string;
  reason?: string;
};

export interface NotificationProvider {
  readonly channel: "in_app" | "email" | "whatsapp";
  readonly enabled: boolean;
  send(message: NotificationMessage): Promise<NotificationResult>;
}

export class DisabledWhatsAppProvider implements NotificationProvider {
  readonly channel = "whatsapp" as const;
  readonly enabled = false;

  async send(): Promise<NotificationResult> {
    return {
      delivered: false,
      reason:
        "WhatsApp is disabled until META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID, and an approved message template are configured.",
    };
  }
}
