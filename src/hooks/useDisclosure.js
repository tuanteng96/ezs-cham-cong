import { useState, useCallback } from 'react';

function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Return an object with the state and a set of helper functions
  return {
    isOpen,
    toggle,
    open,
    close,
  };
}

export default useDisclosure;
