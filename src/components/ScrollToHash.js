import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToHash({ isLoading = false, options }) {
  const location = useLocation();

  useEffect(() => {
    if (isLoading || !location.hash) return;
    const id = location.hash.slice(1);
    const timer = setTimeout(
      () => document.getElementById(id)?.scrollIntoView(options),
      0
    );
    return () => clearTimeout(timer);
  }, [isLoading, location.key, location.hash, options]);

  return null;
}

export default ScrollToHash;
