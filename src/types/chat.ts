export interface Citation {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  section?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error?: string;
}
