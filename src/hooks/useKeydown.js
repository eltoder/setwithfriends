import { useEffect } from "react";

export function getModifierState(event) {
  let res = "";
  if (event.altKey) res += "|Alt";
  if (event.ctrlKey) res += "|Control";
  if (event.shiftKey) res += "|Shift";
  if (event.metaKey) res += "|Meta";
  return res.slice(1);
}

export function getKeyState(event) {
  return {
    // Ignore CapsLock: make key case depend only on Shift.
    key: event.shiftKey ? event.key.toUpperCase() : event.key.toLowerCase(),
    modifier: getModifierState(event),
  };
}

function useKeydown(handler) {
  useEffect(() => {
    const patchedHandler = (event) =>
      document.activeElement.tagName !== "INPUT" && handler(event);
    window.addEventListener("keydown", patchedHandler);
    return () => {
      window.removeEventListener("keydown", patchedHandler);
    };
  }, [handler]);
}

export default useKeydown;
