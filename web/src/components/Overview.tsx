import type { ReactNode } from 'react';
import { currencySymbol, formatNumber, money } from '../lib/format';
import { t } from '../lib/i18n';
import type { Account, ActionKind, Mode } from '../lib/types';
import { DepositIcon, SendIcon, WithdrawIcon } from './Icons';
import TxItem from './TxItem';

interface OverviewProps {
  account: Account;
  mode: Mode;
  onAction: (kind: ActionKind) => void;
  onSeeAll: () => void;
}

const RECENT_COUNT = 3;

export default function Overview({ account, mode, onAction, onSeeAll }: OverviewProps) {
  const actions: { kind: ActionKind; icon: ReactNode }[] = [
    { kind: 'deposit', icon: <DepositIcon /> },
    { kind: 'withdraw', icon: <WithdrawIcon /> },
  ];

  if (mode === 'bank') actions.push({ kind: 'transfer', icon: <SendIcon /> });

  const recent = account.transactions.slice(0, RECENT_COUNT);

  return (
    <div className="overview">
      <section className="balance">
        <span className="label">{t('bank_balance')}</span>
        <div className="balance__value">
          <span className="balance__currency">{currencySymbol()}</span>
          {formatNumber(account.bank)}
        </div>
        <div className="balance__meta">
          <span>{account.name}</span>
          <span className="dot" />
          <span>
            {t('account')} {account.account}
          </span>
        </div>
        <div className="chip">
          {t('cash')} <strong>{money(account.cash)}</strong>
        </div>
      </section>

      <div className="quick-actions" style={{ ['--count' as string]: actions.length }}>
        {actions.map(({ kind, icon }) => (
          <button key={kind} type="button" className="quick-action" onClick={() => onAction(kind)}>
            <span className="quick-action__icon">{icon}</span>
            {t(kind)}
          </button>
        ))}
      </div>

      {mode === 'bank' && (
        <section className="recent">
          <div className="section-head">
            <span className="label">{t('recent')}</span>
            {account.transactions.length > RECENT_COUNT && (
              <button type="button" className="link" onClick={onSeeAll}>
                {t('see_all')}
              </button>
            )}
          </div>
          {recent.length ? (
            <ul className="tx-list">
              {recent.map((tx) => (
                <TxItem key={tx.id} tx={tx} />
              ))}
            </ul>
          ) : (
            <p className="empty">{t('empty_history')}</p>
          )}
        </section>
      )}
    </div>
  );
}
