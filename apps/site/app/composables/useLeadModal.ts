export function useLeadModal() {
  const isOpen = useState<boolean>('lead-modal-open', () => false);
  const open = () => {
    isOpen.value = true;
  };
  const close = () => {
    isOpen.value = false;
  };
  return { isOpen, open, close };
}
