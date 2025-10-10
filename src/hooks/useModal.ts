import { useState } from 'react';

type UseModalReturn = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  openModal: () => void;
  closeModal: () => void;
};

export const useModal = (initialState: boolean = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openModal: open,
    closeModal: close,
    open,
    close,
    toggle,
  };
};
