import { formatDate, money } from '../lib/format';
import { has, t } from '../lib/i18n';
import { INCOMING, type Transaction } from '../lib/types';
import { InIcon, OutIcon } from './Icons';

function describe(tx: Transaction): { title: string; details: string[] } {
  const label = t(`tx_${tx.type}`);
  const date = formatDate(tx.date);

  if (tx.type === 'transfer_in' || tx.type === 'transfer_out') {
    return { title: tx.party || label, details: [tx.note || label, date] };
  }

  if ((tx.type === 'other_in' || tx.type === 'other_out') && tx.note) {
    const reasonKey = `reason_${tx.note}`;
    return { title: has(reasonKey) ? t(reasonKey) : tx.note, details: [label, date] };
  }

  return { title: label, details: [date] };
}

export default function TxItem({ tx }: { tx: Transaction }) {
  const incoming = INCOMING.has(tx.type);
  const { title, details } = describe(tx);

  return (
    <li className="tx">
      <span className={`tx__icon${incoming ? ' is-in' : ''}`}>{incoming ? <InIcon /> : <OutIcon />}</span>
      <span className="tx__body">
        <span className="tx__title">{title}</span>
        <span className="tx__meta">{details.join(' · ')}</span>
      </span>
      <span className={`tx__amount${incoming ? ' is-in' : ''}`}>
        {incoming ? '+' : '−'}
        {money(tx.amount)}
      </span>
    </li>
  );
}
