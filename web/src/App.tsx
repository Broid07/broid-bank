import { useCallback, useEffect, useState } from 'react';
import Actions, { type Notify } from './components/Actions';
import History from './components/History';
import { CloseIcon } from './components/Icons';
import Overview from './components/Overview';
import Tabs, { type TabItem } from './components/Tabs';
import { configureFormat } from './lib/format';
import { setLocale, t } from './lib/i18n';
import { fetchNui, useNuiEvent } from './lib/nui';
import type { Account, ActionKind, OpenPayload } from './lib/types';

type Tab = 'overview' | 'actions' | 'history';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

// Lua boş tabloları {} olarak da gönderebilir; sayılar string gelebilir
function normalize(account: Account): Account {
  return {
    ...account,
    cash: Number(account.cash) || 0,
    bank: Number(account.bank) || 0,
    transactions: Array.isArray(account.transactions) ? account.transactions : [],
  };
}

export default function App() {
  const [visible, setVisible] = useState(false);
  const [session, setSession] = useState<OpenPayload | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [action, setAction] = useState<ActionKind>('deposit');
  const [toast, setToast] = useState<Toast | null>(null);

  useNuiEvent<OpenPayload>('open', (data) => {
    setLocale(data.locale);
    configureFormat(t('number_locale'), data.currency);
    setSession(data);
    setAccount(normalize(data.account));
    setTab('overview');
    setAction('deposit');
    setToast(null);
    setVisible(true);
  });

  useNuiEvent<Account>('update', (data) => setAccount(normalize(data)));
  useNuiEvent('close', () => setVisible(false));

  const close = useCallback(() => {
    setVisible(false);
    void fetchNui('close');
  }, []);

  const notify = useCallback<Notify>((type, message) => setToast({ id: Date.now(), type, message }), []);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, close]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!visible || !session || !account) return null;

  const tabs: TabItem<Tab>[] = [
    { id: 'overview', label: t('tab_overview') },
    { id: 'actions', label: t('tab_actions') },
  ];

  if (session.mode === 'bank') tabs.push({ id: 'history', label: t('tab_history') });

  const openAction = (kind: ActionKind) => {
    setAction(kind);
    setTab('actions');
  };

  return (
    <div className="overlay">
      <div className="stack">
        <main className={`card card--${session.mode}`}>
          <header className="header">
            <div className="brand">
              <span className="brand__mark" />
              <span className="brand__name">{session.brand}</span>
              {session.mode === 'atm' ? (
                <span className="badge">{t('atm')}</span>
              ) : (
                session.location && <span className="brand__location">{session.location}</span>
              )}
            </div>
            <button type="button" className="icon-button" onClick={close} aria-label={t('close')} title={t('close')}>
              <CloseIcon />
            </button>
          </header>

          <Tabs items={tabs} active={tab} onChange={setTab} />

          <div className="content" key={tab}>
            {tab === 'overview' && (
              <Overview account={account} mode={session.mode} onAction={openAction} onSeeAll={() => setTab('history')} />
            )}
            {tab === 'actions' && (
              <Actions
                mode={session.mode}
                account={account}
                limits={session.limits}
                action={action}
                onActionChange={setAction}
                onAccount={(next) => setAccount(normalize(next))}
                notify={notify}
              />
            )}
            {tab === 'history' && <History transactions={account.transactions} />}
          </div>
        </main>

        {toast && (
          <div key={toast.id} className={`toast toast--${toast.type}`} role="status">
            <span className="toast__dot" />
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
}
