export interface EmailOptions {
    to: string;
    from?: string;
    subject?: string;
    html?: string;
    templateId?: string;
    data?: Record<string, any>;
  }
  
  export interface TelegramOptions {
    chatId: string;
    text: string;
    parseMode?: 'HTML' | 'Markdown';
  }