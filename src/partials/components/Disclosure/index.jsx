import useDisclosure from '@/hooks/useDisclosure';
import React, { useRef } from 'react';

function Disclosure({ children, initialState }) {
  const { isOpen, toggle } = useDisclosure(initialState);
  const panelId = useRef(`disclosure-panel-${Math.random().toString(36).substring(2, 9)}`).current;
  const buttonId = useRef(`disclosure-button-${Math.random().toString(36).substring(2, 9)}`).current;

  // The `children` is a function that receives the state and logic
  return children({ isOpen, toggle, panelId, buttonId });
}

export default Disclosure;
