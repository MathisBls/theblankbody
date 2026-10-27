import { en } from './en';

type Messages = typeof en;
export type MessageKey = keyof Messages;
type PluralBaseKey = {
  [Key in MessageKey]: Key extends `${infer Base}.one` ? Base : never;
}[MessageKey];

type MessageParams = Record<string, string | number>;

const pluralRules = new Intl.PluralRules('en');

function interpolate(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  );
}

function isMessageKey(key: string): key is MessageKey {
  return key in en;
}

export function translate(key: MessageKey, params?: MessageParams): string {
  return interpolate(en[key], params);
}

export function translatePlural(baseKey: PluralBaseKey, count: number, params?: MessageParams): string {
  const pluralKey = `${baseKey}.${pluralRules.select(count)}`;
  const key: MessageKey = isMessageKey(pluralKey) ? pluralKey : `${baseKey}.other`;
  return interpolate(en[key], { count, ...params });
}

export function translateDynamic(key: string, fallbackKey: MessageKey): string {
  return isMessageKey(key) ? en[key] : en[fallbackKey];
}
