export type StrengthBadge = "strong" | "medium" | "weak" | null;

export interface Cluster {
  id: string;
  term: string;
  companyXStrength: StrengthBadge;
  competitorStrengths: Record<string, StrengthBadge>;
  volume?: number;
  cpc?: number;
  sourceUrl?: string;
}

export interface FetchParams {
  url?: string;
  queryType: "predefined" | "custom";
  customQuery?: string;
  predefinedQuery?: "top5" | "all" | "competitors";
  urlColumnName?: string;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  companyX: string;
  competitors: string[];
  clusters: Cluster[];
  fetchParams?: FetchParams;
}

export interface AppContextType {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  fetching: Record<string, boolean>;
  setFetching: (fetching: Record<string, boolean>) => void;
  aiMode: boolean;
  setAiMode: (aiMode: boolean) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (key: string) => void;
  anthropicModel: string;
  setAnthropicModel: (model: string) => void;
} 