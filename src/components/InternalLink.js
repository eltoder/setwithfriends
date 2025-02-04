import { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

import Link from "@material-ui/core/Link";

function InternalLink(props, ref) {
  return <Link ref={ref} component={RouterLink} {...props} />;
}

export default forwardRef(InternalLink);
