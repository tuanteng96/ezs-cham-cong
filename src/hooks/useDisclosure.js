import { useState, useCallback, useEffect } from 'react';

function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  // Đồng bộ lại khi initialState thay đổi
  useEffect(() => {
    setIsOpen(initialState);
  }, [initialState]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
    setIsOpen, // xuất thêm setter nếu cần điều khiển trực tiếp
  };
}

export default useDisclosure;
