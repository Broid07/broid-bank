export interface TabItem<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  variant?: 'line' | 'segment';
}

export default function Tabs<T extends string>({ items, active, onChange, variant = 'line' }: TabsProps<T>) {
  const index = Math.max(
    0,
    items.findIndex((item) => item.id === active),
  );

  return (
    <div className={`tabs tabs--${variant}`} role="tablist" style={{ ['--count' as string]: items.length }}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === active}
          className={`tabs__item${item.id === active ? ' is-active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
      <span className="tabs__indicator" style={{ transform: `translateX(${index * 100}%)` }} />
    </div>
  );
}
