import { useEffect, useState, type FormEvent } from 'react';
import { currencySymbol, formatNumber, money } from '../lib/format';
import { t } from '../lib/i18n';
import { fetchNui } from '../lib/nui';
import type { Account, ActionKind, ActionResponse, Limits, Mode } from '../lib/types';
import Tabs from './Tabs';

export type Notify = (type: 'success' | 'error', message: string) => void;

interface ActionsProps {
  mode: Mode;
  account: Account;
  limits: Limits;
  action: ActionKind;
  onActionChange: (kind: ActionKind) => void;
  onAccount: (account: Account) => void;
  notify: Notify;
}

const PRESETS = [100, 500, 1000, 5000];

export default function Actions({ mode, account, limits, action, onActionChange, onAccount, notify }: ActionsProps) {
  const [amount, setAmount] = useState<number | null>(null);
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount(null);
    setTarget('');
    setNote('');
    setConfirming(false);
  }, [action]);

  const isTransfer = action === 'transfer';
  const available = action === 'deposit' ? account.cash : account.bank;
  const atmLimit = mode === 'atm' && action === 'withdraw' ? limits.atmWithdraw : null;
  const maxAllowed = Math.max(0, Math.min(available, limits.max, atmLimit ?? Infinity));

  const items = [
    { id: 'deposit' as const, label: t('deposit') },
    { id: 'withdraw' as const, label: t('withdraw') },
    ...(mode === 'bank' ? [{ id: 'transfer' as const, label: t('transfer') }] : []),
  ];

  const onAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setAmount(digits ? Math.min(Number(digits), limits.max) : null);
    setConfirming(false);
  };

  const validate = (): string | null => {
    if (!amount || amount < 1) return t('error_invalid_amount');
    if (isTransfer && !(Number(target) > 0)) return t('error_player_not_found');
    if (atmLimit !== null && amount > atmLimit) return t('error_atm_limit', money(atmLimit));
    if (amount > available) return t(action === 'deposit' ? 'error_insufficient_cash' : 'error_insufficient_bank');
    return null;
  };

  const submit = async () => {
    if (!amount) return;
    setLoading(true);

    const payload = isTransfer ? { amount, target: Number(target), note } : { amount };
    const response = await fetchNui<ActionResponse>(action, payload).catch(() => null);

    setLoading(false);
    setConfirming(false);

    if (!response?.ok) {
      const error = response?.error ?? 'unknown';
      notify('error', error === 'atm_limit' ? t('error_atm_limit', money(limits.atmWithdraw)) : t(`error_${error}`));
      return;
    }

    if (response.account) onAccount(response.account);

    notify(
      'success',
      isTransfer ? t('success_transfer', money(amount), response.info?.name ?? `ID ${target}`) : t(`success_${action}`, money(amount)),
    );

    setAmount(null);
    setTarget('');
    setNote('');
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;

    const error = validate();
    if (error) return notify('error', error);

    if (isTransfer && !confirming) return setConfirming(true);

    void submit();
  };

  return (
    <form className="actions" onSubmit={onSubmit}>
      <Tabs variant="segment" items={items} active={action} onChange={onActionChange} />

      <div className="available">
        <span>{t(action === 'deposit' ? 'available_cash' : 'available_bank')}</span>
        <strong>{money(available)}</strong>
      </div>

      {isTransfer && (
        <label className="field">
          <span className="label">{t('target_id')}</span>
          <input
            className="input"
            inputMode="numeric"
            placeholder="0"
            maxLength={6}
            value={target}
            onChange={(event) => {
              setTarget(event.target.value.replace(/\D/g, ''));
              setConfirming(false);
            }}
          />
        </label>
      )}

      <label className="field">
        <span className="label">{t('amount')}</span>
        <span className="amount-input">
          <span className="amount-input__currency">{currencySymbol()}</span>
          <input
            className="amount-input__field"
            inputMode="numeric"
            placeholder="0"
            autoFocus={!isTransfer}
            value={amount ? formatNumber(amount) : ''}
            onChange={(event) => onAmountChange(event.target.value)}
          />
        </span>
      </label>

      <div className="presets">
        {PRESETS.map((value) => (
          <button key={value} type="button" className="preset" disabled={value > maxAllowed} onClick={() => onAmountChange(String(value))}>
            {formatNumber(value)}
          </button>
        ))}
        <button type="button" className="preset" disabled={maxAllowed < 1} onClick={() => onAmountChange(String(maxAllowed))}>
          {t('all')}
        </button>
      </div>

      {atmLimit !== null && <p className="hint">{t('atm_limit_hint', money(atmLimit))}</p>}

      {isTransfer && (
        <label className="field">
          <span className="label">{t('note')}</span>
          <input
            className="input"
            placeholder={t('note_placeholder')}
            maxLength={limits.note}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
      )}

      <div className="actions__footer">
        {confirming ? (
          <div className="confirm">
            <p>{t('confirm_transfer', money(amount ?? 0), target)}</p>
            <div className="confirm__buttons">
              <button type="button" className="button button--ghost" onClick={() => setConfirming(false)}>
                {t('cancel')}
              </button>
              <button type="submit" className="button" disabled={loading}>
                {loading ? <span className="spinner" /> : t('confirm')}
              </button>
            </div>
          </div>
        ) : (
          <button type="submit" className="button button--block" disabled={loading || !amount}>
            {loading ? <span className="spinner" /> : `${t(action)}${amount ? ` · ${money(amount)}` : ''}`}
          </button>
        )}
      </div>
    </form>
  );
}
