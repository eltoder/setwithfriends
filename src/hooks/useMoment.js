import { useEffect, useState } from "react";

import useFirebaseRef from "./useFirebaseRef";

function useMoment(delay = 1000) {
  const [time, setTime] = useState(Date.now()); // Estimated firebase server time
  const [offset] = useFirebaseRef(".info/serverTimeOffset");

  useEffect(() => {
    if (!delay) return;
    const id = setInterval(() => setTime(Date.now() + offset), delay);
    return () => clearInterval(id);
  }, [offset, delay]);

  return time;
}

export default useMoment;
