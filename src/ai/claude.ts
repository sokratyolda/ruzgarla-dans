/**
 * Claude API ile metin değerlendirmesi.
 *
 * Anahtar yalnızca bu cihazda (IndexedDB) saklanır ve yalnızca api.anthropic.com'a gönderilir.
 * SDK'daki `dangerouslyAllowBrowser: true` seçeneği isteğe
 * `anthropic-dangerous-direct-browser-access: true` başlığını ekler; tarayıcıdan
 * doğrudan çağrı için gereklidir. Kişisel, tek kullanıcılı bir uygulama olduğu için uygundur:
 * anahtar senin cihazından başka yere gitmez.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { AiFeedback, Settings } from '../db/db';
import type { WritingExercise } from '../content/types';
import { SYSTEM_PROMPT, buildUserMessage, feedbackSchema } from './prompt';

export const MODEL_OPTIONS = [
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5 (önerilen)' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5 (daha ucuz)' },
];

export class AiUnavailable extends Error {}

const client = (apiKey: string) => new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 90_000 });

/** Reddedilme durumunda sunucu tarafı yedek model desteği (Sonnet/Opus ailesinde) */
const supportsFallback = (model: string) => /^claude-(sonnet-5-5|opus-5)/.test(model);

export async function evaluateWriting(
  settings: Pick<Settings, 'apiKey' | 'model'>,
  ex: WritingExercise,
  response: string | Record<string, string>,
  previous?: string,
): Promise<AiFeedback> {
  if (!settings.apiKey) throw new AiUnavailable('API anahtarı yok');
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw new AiUnavailable('Çevrimdışı');

  const c = client(settings.apiKey.trim());
  const model = settings.model || 'claude-sonnet-5-5';
  const body = {
    model,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user' as const, content: buildUserMessage(ex, response, previous) }],
    output_config: {
      effort: 'medium' as const,
      format: { type: 'json_schema' as const, schema: feedbackSchema(ex) as unknown as Record<string, unknown> },
    },
  };

  let msg;
  if (supportsFallback(model)) {
    try {
      msg = await c.beta.messages.create({ ...body, betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    } catch (e) {
      // Yedek model parametresi kabul edilmezse düz istekle bir kez daha dene
      if (e instanceof Anthropic.BadRequestError && /fallback/i.test(e.message)) msg = await c.messages.create(body);
      else throw e;
    }
  } else {
    msg = await c.messages.create(body);
  }

  if (msg.stop_reason === 'refusal') throw new Error('Model bu metni değerlendirmeyi reddetti.');
  if (msg.stop_reason === 'max_tokens') throw new Error('Değerlendirme yarıda kesildi; tekrar dene.');
  const text = msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  let parsed: Omit<AiFeedback, 'model' | 'date'>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Değerlendirme okunamadı.');
  }
  return { ...parsed, model: msg.model, date: new Date().toISOString() };
}

/** Ayarlar ekranındaki "Bağlantıyı dene" düğmesi */
export async function testConnection(settings: Pick<Settings, 'apiKey' | 'model'>): Promise<string> {
  const c = client(settings.apiKey.trim());
  const msg = await c.messages.create({
    model: settings.model,
    max_tokens: 200,
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: 'Tek kelimeyle selam ver.' }],
  });
  return msg.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('').trim();
}

/** Kullanıcıya gösterilecek sade hata metni */
export function explainError(e: unknown): string {
  if (e instanceof AiUnavailable) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return 'API anahtarı geçersiz görünüyor. Ayarlar\'dan kontrol et.';
  if (e instanceof Anthropic.PermissionDeniedError) return 'Bu anahtarın bu modele erişimi yok.';
  if (e instanceof Anthropic.NotFoundError) return 'Model adı bulunamadı. Ayarlar\'dan model adını kontrol et.';
  if (e instanceof Anthropic.RateLimitError) return 'Kısa süre içinde çok istek gitti; biraz sonra yeniden denenecek.';
  if (e instanceof Anthropic.APIConnectionError) return 'Bağlantı kurulamadı; internet gelince yeniden denenecek.';
  if (e instanceof Anthropic.APIError) return `Sunucu hatası (${e.status ?? '?'}): ${e.message}`;
  return e instanceof Error ? e.message : String(e);
}

/** Bağlantı kaynaklı (yeniden denenebilir) hata mı? */
export const isTransient = (e: unknown) =>
  e instanceof AiUnavailable ||
  e instanceof Anthropic.APIConnectionError ||
  e instanceof Anthropic.RateLimitError ||
  (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500);
