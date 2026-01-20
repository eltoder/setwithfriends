import Container from "@material-ui/core/Container";
import Typography from "@material-ui/core/Typography";

import cowImage from "../assets/cow_404.png";

function NotFoundPage() {
  return (
    <Container>
      <Typography variant="h4" align="center" gutterBottom>
        Not Found
      </Typography>
      <img
        src={cowImage}
        alt="404"
        style={{ display: "block", maxWidth: "100%", margin: "0 auto 8px" }}
      />
    </Container>
  );
}

export default NotFoundPage;
