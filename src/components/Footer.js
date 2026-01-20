import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";

import InternalLink from "./InternalLink";

function Footer() {
  return (
    <Typography variant="body1" align="center" style={{ padding: "16px 0" }}>
      <InternalLink to="/help">Help</InternalLink> •{" "}
      <InternalLink to="/about">About</InternalLink> •{" "}
      <InternalLink to="/conduct">Conduct</InternalLink> •{" "}
      <Link
        target="_blank"
        rel="noopener"
        href="https://github.com/eltoder/setwithfriends"
      >
        GitHub
      </Link>
      {" • "}
      <Link target="_blank" rel="noopener" href="https://discord.gg/XbjJyc9">
        Discord
      </Link>
    </Typography>
  );
}

export default Footer;
