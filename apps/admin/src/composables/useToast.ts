import { ref } from 'vue';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'success';
}

const toasts = ref<Toast[]>([]);
let nextId = 1;

export function useToast() {
  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function push(message: string, type: Toast['type'] = 'error'): void {
    const id = nextId++;
    toasts.value = [...toasts.value, { id, message, type }];
    setTimeout(() => dismiss(id), 5000);
  }

  return { toasts, push, dismiss };
}
