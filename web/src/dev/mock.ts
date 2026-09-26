// Yalnızca `npm run dev` ile tarayıcıda çalışırken kullanılır; oyun build'ine dahil edilmez.
import type { Account, ActionResponse, Mode, OpenPayload, Transaction, TxType } from '../lib/types';

const now = Math.floor(Date.now() / 1000);
let nextId = 100;

const account: Account = {
  name: 'Deniz Aksoy',
  account: 'US0482913',
  cash: 2450,
  bank: 128450,
  transactions: [
    { id: 9, type: 'transfer_in', amount: 1500, party: 'Mert Kaya', note: 'Kira payı', date: now - 900 },
    { id: 8, type: 'withdraw', amount: 500, date: now - 5400 },
    { id: 7, type: 'other_in', amount: 2250, note: 'paycheck', date: now - 7200 },
    { id: 6, type: 'transfer_out', amount: 320, party: 'Elif Demir', date: now - 86400 },
    { id: 5, type: 'deposit', amount: 4000, date: now - 90000 },
    { id: 4, type: 'other_out', amount: 180, note: 'Otopark cezası', date: now - 172800 },
    { id: 3, type: 'other_in', amount: 2250, note: 'paycheck', date: now - 180000 },
    { id: 2, type: 'transfer_out', amount: 12000, party: 'Can Öztürk', note: 'Araç', date: now - 260000 },
    { id: 1, type: 'deposit', amount: 800, date: now - 350000 },
  ],
};

const limits = { max: 10000000, atmWithdraw: 5000, note: 60 };
let mode: Mode = new URLSearchParams(location.search).get('mode') === 'atm' ? 'atm' : 'bank';

function post(action: string, data?: unknown) {
  window.dispatchEvent(new MessageEvent('message', { data: { action, data } }));
}

function log(type: TxType, amount: number, extra: Partial<Transaction> = {}) {
  account.transactions.unshift({ id: nextId++, type, amount, date: Math.floor(Date.now() / 1000), ...extra });
}

export function openMock() {
  const payload: OpenPayload = {
    mode,
    brand: 'Broid',
    location: 'Fleeca · Legion Square',
    currency: '$',
    limits,
    account: structuredClone(account),
  };

  setTimeout(() => post('open', payload), 50);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockFetch(event: string, data: unknown): Promise<unknown> {
  await wait(250);

  const input = (data ?? {}) as { amount?: number; target?: number; note?: string };
  const amount = Number(input.amount);
  const fail = (error: string): ActionResponse => ({ ok: false, error });
  const done = (info?: ActionResponse['info']): ActionResponse => ({ ok: true, account: structuredClone(account), info });

  switch (event) {
    case 'close':
      // Tarayıcıda kapatınca tekrar aç ki önizleme kaybolmasın
      setTimeout(openMock, 600);
      return 1;

    case 'deposit':
      if (amount > account.cash) return fail('insufficient_cash');
      account.cash -= amount;
      account.bank += amount;
      log('deposit', amount);
      return done();

    case 'withdraw':
      if (mode === 'atm' && amount > limits.atmWithdraw) return fail('atm_limit');
      if (amount > account.bank) return fail('insufficient_bank');
      account.bank -= amount;
      account.cash += amount;
      log('withdraw', amount);
      return done();

    case 'transfer':
      if (input.target === 1) return fail('self_transfer');
      if (Number(input.target) > 64) return fail('player_not_found');
      if (amount > account.bank) return fail('insufficient_bank');
      account.bank -= amount;
      log('transfer_out', amount, { party: 'Mert Kaya', note: input.note || null });
      return done({ name: 'Mert Kaya' });
  }

  return fail('unknown');
}

// Konsoldan mod değiştirmek için: __bank('atm')
(window as unknown as { __bank: (next: Mode) => void }).__bank = (next) => {
  mode = next;
  openMock();
};
