import useDisclosure from "@/hooks/useDisclosure";
import { useEffect, useRef } from "react";

function Disclosure({ children, initialState }) {
  const { isOpen, toggle, setIsOpen } = useDisclosure(initialState);

  useEffect(() => {
    setIsOpen(initialState);
  }, [initialState, setIsOpen]);

  const panelId = useRef(
    `disclosure-panel-${Math.random().toString(36).substring(2, 9)}`
  ).current;
  const buttonId = useRef(
    `disclosure-button-${Math.random().toString(36).substring(2, 9)}`
  ).current;

  // The `children` is a function that receives the state and logic
  return children({ isOpen, toggle, panelId, buttonId });
}

export default Disclosure;
