import { useState } from 'react';
import { t } from '../lib/i18n';
import { INCOMING, type Transaction } from '../lib/types';
import Tabs from './Tabs';
import TxItem from './TxItem';

type Filter = 'all' | 'in' | 'out';

export default function History({ transactions }: { transactions: Transaction[] }) {
  const [filter, setFilter] = useState<Filter>('all');

  const visible = filter === 'all' ? transactions : transactions.filter((tx) => INCOMING.has(tx.type) === (filter === 'in'));

  return (
    <div className="history">
      <Tabs
        variant="segment"
        active={filter}
        onChange={setFilter}
        items={[
          { id: 'all', label: t('filter_all') },
          { id: 'in', label: t('filter_in') },
          { id: 'out', label: t('filter_out') },
        ]}
      />

      {visible.length ? (
        <ul className="tx-list history__list">
          {visible.map((tx) => (
            <TxItem key={tx.id} tx={tx} />
          ))}
        </ul>
      ) : (
        <p className="empty">{t('empty_history')}</p>
      )}
    </div>
  );
}
