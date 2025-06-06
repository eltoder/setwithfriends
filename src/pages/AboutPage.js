import Container from "@material-ui/core/Container";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import InternalLink from "../components/InternalLink";

function AboutPage() {
  return (
    <Container>
      <Typography variant="h4" align="center" style={{ marginTop: 24 }}>
        About
      </Typography>
      <Paper style={{ padding: "1rem", maxWidth: 720, margin: "12px auto" }}>
        <Typography variant="body1" gutterBottom>
          Set with Forks was originally started as Set with Friends by{" "}
          <Link href="https://github.com/ekzhang">Eric Zhang</Link> and{" "}
          <Link href="https://github.com/cynthiakedu">Cynthia Du</Link> in early
          2020. We love the game, and our goal was to bridge the distance
          between friends by creating the simplest, free interface for playing
          Set online.
        </Typography>
        <Typography variant="body1" gutterBottom>
          The code powering this site is completely open source and available on{" "}
          <Link href="https://github.com/eltoder/setwithfriends">GitHub</Link>.
          We are happy to provide mentorship for contributors from all
          backgrounds, whether you're a seasoned programmer or just want to
          learn more about web development.
        </Typography>
        <Typography variant="body1" gutterBottom>
          This site would not be possible without many people's help: the{" "}
          <Link href="https://github.com/eltoder/setwithfriends/graphs/contributors">
            volunteer developers
          </Link>{" "}
          who contributed code to add features and fix bugs and many others who
          reported bugs and provided feedback.
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>
            If you have suggestions, the best way to reach us is by{" "}
            <Link href="https://github.com/eltoder/setwithfriends/issues">
              filing an issue
            </Link>
            .
          </strong>
        </Typography>
      </Paper>
      <Paper style={{ padding: "1rem", maxWidth: 720, margin: "12px auto" }}>
        <Typography variant="body2">
          By using this site, you agree to our{" "}
          <InternalLink to="/legal">terms of service</InternalLink>.
        </Typography>
      </Paper>
      <Typography
        variant="body1"
        align="center"
        style={{ marginTop: 12, paddingBottom: 12 }}
      >
        <InternalLink to="/">Return to home</InternalLink>
      </Typography>
    </Container>
  );
}

export default AboutPage;
