import formatDistanceStrict from "date-fns/formatDistanceStrict";

import useMoment from "../hooks/useMoment";

// Wrapper around useMoment, since state hooks cause rerender of component
function ElapsedTime({ value }) {
  const time = useMoment(5000);
  const opts = { addSuffix: true };
  return <>{formatDistanceStrict(value, time, opts)}</>;
}

export default ElapsedTime;
