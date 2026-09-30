import { ref, shallowRef } from 'vue';
import { api } from '../lib/api';

export function useCrudResource<
  TItem extends { id: string },
  TCreate = Partial<TItem>,
  TUpdate = Partial<TItem>,
>(basePath: string) {
  // shallowRef, not ref: items are plain DTOs (no nested reactivity needed),
  // and ref()'s UnwrapRef<T> inference breaks down for a generic T here —
  // shallowRef sidesteps that while still auto-unwrapping in templates.
  const items = shallowRef<TItem[]>([]);
  const loading = ref(false);

  async function fetchAll(): Promise<void> {
    loading.value = true;
    try {
      // services/advantages/team have no isPublished-style split, so the
      // backend only exposes a public GET (no admin/-prefixed GET) — see
      // src/{services,advantages,team}/*.controller.ts. Listing hits that
      // public route; every mutation below still goes through /admin/*.
      items.value = await api.get<TItem[]>(basePath);
    } finally {
      loading.value = false;
    }
  }

  async function create(payload: TCreate): Promise<TItem> {
    const created = await api.post<TItem>(`/admin${basePath}`, payload);
    items.value = [...items.value, created];
    return created;
  }

  async function update(id: string, payload: TUpdate): Promise<TItem> {
    const updated = await api.patch<TItem>(`/admin${basePath}/${id}`, payload);
    items.value = items.value.map((item) => (item.id === id ? updated : item));
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await api.delete(`/admin${basePath}/${id}`);
    items.value = items.value.filter((item) => item.id !== id);
  }

  async function reorder(ids: string[]): Promise<void> {
    items.value = await api.patch<TItem[]>(`/admin${basePath}/reorder`, { ids });
  }

  return { items, loading, fetchAll, create, update, remove, reorder };
}
