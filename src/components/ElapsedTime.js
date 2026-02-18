import formatDistance from "date-fns/formatDistance";

import useMoment from "../hooks/useMoment";

// Wrapper around useMoment, since state hooks cause rerender of component
function ElapsedTime({ value }) {
  const time = useMoment();
  const opts = { addSuffix: true, includeSeconds: true };
  return <>{formatDistance(value, time, opts).replace(/^about /, "")}</>;
}

export default ElapsedTime;
