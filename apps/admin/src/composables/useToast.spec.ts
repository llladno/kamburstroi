import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast with a generated id', () => {
    const { toasts, push } = useToast();
    const before = toasts.value.length;

    push('Сохранено', 'success');

    expect(toasts.value.length).toBe(before + 1);
    expect(toasts.value.at(-1)).toMatchObject({ message: 'Сохранено', type: 'success' });
  });

  it('defaults to type "error"', () => {
    const { toasts, push } = useToast();
    push('Что-то пошло не так');
    expect(toasts.value.at(-1)?.type).toBe('error');
  });

  it('removes a toast on dismiss', () => {
    const { toasts, push, dismiss } = useToast();
    push('temp');
    const id = toasts.value.at(-1)!.id;

    dismiss(id);

    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });

  it('auto-dismisses a toast after 5 seconds', () => {
    const { toasts, push } = useToast();
    push('auto-gone');
    const id = toasts.value.at(-1)!.id;

    vi.advanceTimersByTime(5000);

    expect(toasts.value.find((t) => t.id === id)).toBeUndefined();
  });
});
