'use client';
import { useCallback, useState } from 'react';

export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev: boolean) => !prev), []);

  return { isOpen, openModal, closeModal, toggleModal } as const;
};
