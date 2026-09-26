export type Mode = 'bank' | 'atm';

export type ActionKind = 'deposit' | 'withdraw' | 'transfer';

export type TxType = 'deposit' | 'withdraw' | 'transfer_in' | 'transfer_out' | 'other_in' | 'other_out';

export interface Transaction {
  id: number;
  type: TxType;
  amount: number;
  party?: string | null;
  note?: string | null;
  /** Unix zamanı (saniye) */
  date: number;
}

export interface Account {
  name: string;
  account: string;
  cash: number;
  bank: number;
  transactions: Transaction[];
}

export interface Limits {
  max: number;
  atmWithdraw: number;
  note: number;
}

export interface OpenPayload {
  mode: Mode;
  brand: string;
  location?: string;
  currency: string;
  locale?: Record<string, string> | null;
  limits: Limits;
  account: Account;
}

export interface ActionResponse {
  ok: boolean;
  error?: string;
  account?: Account;
  info?: { name?: string };
}

export const INCOMING: ReadonlySet<TxType> = new Set(['deposit', 'transfer_in', 'other_in']);
