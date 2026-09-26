import { useEffect, useRef } from 'react';

interface CfxWindow extends Window {
  invokeNative?: unknown;
  GetParentResourceName?: () => string;
}

const cfx = window as CfxWindow;

export const isEnvBrowser = (): boolean => !cfx.invokeNative;

export async function fetchNui<T = unknown>(event: string, data: unknown = {}): Promise<T> {
  if (import.meta.env.DEV && isEnvBrowser()) {
    const { mockFetch } = await import('../dev/mock');
    return mockFetch(event, data) as Promise<T>;
  }

  const resource = cfx.GetParentResourceName ? cfx.GetParentResourceName() : 'broid-bank';
  const response = await fetch(`https://${resource}/${event}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  });

  return response.json();
}

export function useNuiEvent<T>(action: string, handler: (data: T) => void) {
  const saved = useRef(handler);
  saved.current = handler;

  useEffect(() => {
    const listener = (event: MessageEvent<{ action?: string; data?: T }>) => {
      if (event.data?.action === action) saved.current(event.data.data as T);
    };

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [action]);
}
