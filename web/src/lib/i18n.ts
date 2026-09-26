import fallback from '../../../locales/tr.json';

type Dict = Record<string, string>;

let dict: Dict = fallback;

/** Lua tarafından gelen ox_lib çevirileri; eksik anahtarlar Türkçe dosyadan tamamlanır. */
export function setLocale(next?: Dict | null) {
  dict = next && typeof next === 'object' ? { ...fallback, ...next } : fallback;
}

/** ox_lib ile aynı biçim: metindeki her %s / %d sırayla argümanlarla değiştirilir. */
export function t(key: string, ...args: (string | number)[]): string {
  const text = dict[key] ?? key;
  let index = 0;
  return text.replace(/%[sd]/g, () => String(args[index++] ?? ''));
}

export function has(key: string): boolean {
  return key in dict;
}
