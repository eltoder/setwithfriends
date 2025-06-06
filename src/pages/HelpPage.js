import { useContext } from "react";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Link from "@material-ui/core/Link";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";

import InternalLink from "../components/InternalLink";
import SetCard from "../components/SetCard";
import { SettingsContext } from "../context";
import { BASE_RATING, SCALING_FACTOR } from "../game";

function HelpPage() {
  const { keyboardLayout, keyboardLayoutName } = useContext(SettingsContext);

  const shortcutsTable = (shortcuts) => (
    <Grid container style={{ maxWidth: 500, margin: "8px 0 16px 0" }}>
      {shortcuts.flatMap(([command, key]) => [
        <Grid item key={command} xs={8}>
          <Typography variant="body1">{command}</Typography>
        </Grid>,
        <Grid item key={`${command}-key`} xs={4}>
          <Typography variant="body1">
            <strong>{key}</strong>
          </Typography>
        </Grid>,
      ])}
    </Grid>
  );

  return (
    <Container>
      <Typography variant="h4" align="center" style={{ marginTop: 24 }}>
        Help
      </Typography>

      <Paper style={{ padding: "1rem", maxWidth: 720, margin: "12px auto" }}>
        <Typography variant="h5" gutterBottom>
          Rules
        </Typography>
        <Typography variant="body1" gutterBottom>
          Welcome to Set with Forks! This web app allows you to play Set, the
          popular real-time card game designed by Marsha Falco in 1974 (
          <Link href="https://en.wikipedia.org/wiki/Set_(card_game)">
            Wikipedia
          </Link>
          ). The game is a race to find as many <em>sets</em>, or three-card
          triplets with a certain property, as possible from among the cards in
          the playing area. In this online variant, this is as simple as
          clicking on the three cards when you find a set, and the computer will
          handle all the details of dealing cards and keeping score.
        </Typography>
        <Typography variant="body1" gutterBottom>
          If you haven't played before, don't worry! We'll explain the rules
          below.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1120" />
          <SetCard value="2011" />
          <SetCard value="0202" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          Set is played with a special deck of 3<sup>4</sup> = 81 cards. You can
          see some examples of Set cards above. Each card has four features that
          distinguish it from the others: color, shape, shading, and number. For
          each feature, there are three variants, as shown in the example.
        </Typography>
        <Typography component="div" variant="body1" gutterBottom>
          <ul>
            <li>Three colors: green, red/orange, and purple.</li>
            <li>Three shapes: ovals, squiggles, and diamonds.</li>
            <li>Three shadings: striped, outlined, and filled.</li>
            <li>Three numbers: one, two, and three.</li>
          </ul>
        </Typography>
        <Typography variant="body1" gutterBottom>
          A <em>set</em> is a combination of three cards such that for each of
          the four features, the variants of that feature expressed by the three
          cards are <strong>either all the same or all different</strong>. For
          example, the three cards shown above form a set, because each feature
          is expressed in all three variants between the cards. You can also
          have sets where some features are different and others are the same.
          The three cards below also form a set.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0010" />
          <SetCard value="0212" />
          <SetCard value="0111" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          In the example above, the three cards are identical in shading
          (outlined) and color (purple), while being all different in number and
          shape. In general, some subset of features could be all the same among
          the three cards, with the rest of the features being all different.
          You can verify a couple more examples of sets below.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="2221" />
          <SetCard value="2211" />
          <SetCard value="2201" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0200" />
          <SetCard value="1101" />
          <SetCard value="2002" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          However, a triplet of cards needs to be correct in all four features
          to be a set. The three cards below do <strong>not</strong> form a set,
          due to their color. Two of the cards are green while the third is
          purple, so the three colors are neither all the same, nor all
          different. In general, three cards do not form a set if, for any of
          the features, two cards are the same and the third card is different.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1010" />
          <SetCard value="0001" />
          <SetCard value="1022" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          You should practice these rules a few times until you've mastered
          them.
        </Typography>
        <Typography variant="body1" gutterBottom>
          To play Set, 12 cards are dealt from the deck. When a player finds a
          set, they take those three cards from the playing area, and three new
          cards are dealt to replace the ones that were taken. The game ends
          when the deck is empty and no more sets are available, and your score
          is equal to the number of sets you've found.
        </Typography>
        <Typography variant="body1" gutterBottom>
          In some rare occasions, there will not be any sets among the 12 cards
          in the playing area. In these cases, the computer will automatically
          deal out 3 extra cards (for a total of 15), and play will resume
          normally. In even rarer cases when there are no sets among these 15
          cards, additional cards will be dealt out in multiples of 3.
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>
            That's all there are to the rules of Set, so head back and start
            playing!
          </strong>
        </Typography>

        <hr />

        <Typography variant="h5" gutterBottom>
          Controls and layout
        </Typography>
        <Typography variant="body1" gutterBottom>
          To indicate a set in the game interface, you can select three cards
          either by clicking, tapping, or using the following keyboard
          shortcuts, if you prefer.
        </Typography>
        <Typography component="div" variant="body1" gutterBottom>
          <ul>
            <li>
              Select the first twelve cards with keys{" "}
              <code>{keyboardLayout.verticalLayout.slice(0, 12)}</code>.
            </li>
            <li>
              Select any additional cards with keys{" "}
              <code>{keyboardLayout.verticalLayout.slice(12)}</code>.
            </li>
          </ul>
        </Typography>
        <Typography variant="body1" gutterBottom>
          You can choose the board layout (between portrait and landscape) and
          the cards orientation (between horizontal and vertical) in the
          settings. The former also changes the keyboard shortcuts, which may be
          more convenient to use.
        </Typography>
        {keyboardLayoutName !== "Custom" && (
          <Typography variant="body1" gutterBottom>
            If you are using a different keyboard layout than{" "}
            <code>{keyboardLayoutName}</code>, you can enjoy using the same
            keyboard shortcuts by selecting your keyboard layout in the
            settings. You can also select the <code>Custom</code> layout and
            enter fully custom keyboard shortcuts. Your choices will be
            reflected in the list above.
          </Typography>
        )}
        <Typography variant="h6" gutterBottom>
          Keyboard shortcuts
        </Typography>
        <Typography variant="body1" gutterBottom>
          Additionally, the following keyboard shortcuts are available:
        </Typography>
        {shortcutsTable([
          ["New game", "Ctrl+Enter"],
          ["New private game", "Shift+Enter"],
          ["Start game", "Ctrl+Enter"],
          ["Play again", "Ctrl+Enter"],
          ["Mute or unmute sound", "Ctrl+S"],
          ["Change theme", "Ctrl+E"],
          ["Change board orientation", "Ctrl+O"],
          ["Change cards orientation", "Ctrl+I"],
          ["Pause or resume game", "Ctrl+P"],
          ["Quit game", "Ctrl+Q"],
          ["Unselect cards", "Space or Escape"],
        ])}

        <hr />
        <Typography variant="h5" gutterBottom>
          Game modes
        </Typography>
        <Typography variant="body1" gutterBottom>
          For experienced players, there are many interesting variations on the
          standard Set game. Currently this site lets you play the following
          variants:
        </Typography>
        <Typography variant="h6" gutterBottom>
          Junior
        </Typography>
        <Typography variant="body1" gutterBottom>
          Set Junior is a simplified version of the standard Set that only uses
          cards with solid shading. This means that every card has only{" "}
          <strong>three</strong> features instead of four &mdash; great for
          beginners!
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="200" />
          <SetCard value="011" />
          <SetCard value="122" />
        </Typography>
        <Typography variant="h6" gutterBottom>
          Set-Chain
        </Typography>
        <Typography variant="body1" gutterBottom>
          Playing Set-Chain is almost the same as playing Set normally. The only
          difference is that after you pick the first set, every new set should
          include <strong>exactly one card from the previous set</strong>. For
          example, the first three sets of a game might look as follows:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1210" />
          <SetCard value="0101" />
          <SetCard value="2022" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="2022" />
          <SetCard value="0011" />
          <SetCard value="1000" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0011" />
          <SetCard value="0212" />
          <SetCard value="0110" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          In this case, the first card in the second set is the third card from
          the first set, and the first card in the third set is the second card
          from the second set.
        </Typography>
        <Typography variant="h6" gutterBottom>
          UltraSet
        </Typography>
        <Typography variant="body1" gutterBottom>
          In UltraSet, you should pick out four cards (instead of three) at a
          time. The first pair and the second pair of these four cards should
          form a set <strong>with the same additional card</strong>. For
          example, one valid choice of the four cards could be:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1202" />
          <SetCard value="1122" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0212" />
          <SetCard value="2112" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          The first pair consists of the two cards in the first row, and the
          second pair consists of the two cards in the second row. The "fifth"
          card, which does not need to be present on the board, is drawn below.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1012" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          These four cards form an ultraset, because both of the following are
          valid regular sets.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1202" />
          <SetCard value="1122" />
          <SetCard value="1012" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0212" />
          <SetCard value="2112" />
          <SetCard value="1012" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          Note that you do not have to select the four cards in any particular
          order while playing.
        </Typography>
        <Typography variant="h6" gutterBottom>
          UltraSet-Chain
        </Typography>
        <Typography variant="body1" gutterBottom>
          Set-Chain meets UltraSet. After you pick the first UltraSet, every new
          UltraSet should have{" "}
          <strong>exactly two cards from the previous UltraSet</strong>. For
          example, the first three UltraSets of a game might look as follows:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1202" />
          <SetCard value="1122" />
          <SetCard value="0212" />
          <SetCard value="2112" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1122" />
          <SetCard value="0212" />
          <SetCard value="0112" />
          <SetCard value="1222" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1122" />
          <SetCard value="0112" />
          <SetCard value="2220" />
          <SetCard value="2011" />
        </Typography>
        <Typography variant="h6" gutterBottom>
          Ultra9
        </Typography>
        <Typography variant="body1" gutterBottom>
          Ultra9 follows the same rules as UltraSet, but 9 cards are dealt
          instead of 12. This makes the game harder because there are many fewer
          UltraSets on the board. In the very rare case that there are no
          UltraSets among the 9 cards, 3 additional cards are dealt. (There is
          always an UltraSet in any 10 cards.)
        </Typography>
        <Typography variant="h6" gutterBottom>
          MegaSet
        </Typography>
        <Typography variant="body1" gutterBottom>
          This is an extended version of Set where each card has a{" "}
          <strong>fifth</strong> feature &mdash; border style. Every card has
          either a single, double or dotted border.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="02000" />
          <SetCard value="12011" />
          <SetCard value="22022" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          The goal is the same as in the standard Set &mdash; find sets of three
          cards that, for each of the five features, have variants of that
          feature that are either all the same or all different. Since the
          probability of 3 cards forming a five-feature set is lower, 16 cards
          are dealt instead of 12.
        </Typography>
        <Typography variant="body1" gutterBottom>
          With 5 features, there are 3<sup>5</sup> = 243 cards in the deck. Be
          prepared for a long game.
        </Typography>
        <Typography variant="h6" gutterBottom>
          GhostSet
        </Typography>
        <Typography variant="body1" gutterBottom>
          In GhostSet, you should pick out 3 disjoint pairs of cards (6 cards in
          total) at a time. The 3 cards{" "}
          <em>that complete each of the pairs to sets</em> should themselves
          form a set. The game is called &ldquo;ghost set&rdquo; because these 3
          cards do not need to be present on the board. For example, one valid
          selection of the six cards could be:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0211" />
          <SetCard value="2211" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1100" />
          <SetCard value="2222" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0210" />
          <SetCard value="1012" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          Each row is one of the pairs. The corresponding &ldquo;ghost
          set&rdquo; is shown below.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1211" />
          <SetCard value="0011" />
          <SetCard value="2111" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          Finding a GhostSet can be quite hard in general, but there are two
          easy special cases &mdash; 2 disjoint regular sets and a 3-pair
          UltraSet (that is, 3 pairs of cards that form sets with the same
          additional card).
        </Typography>
        <Typography variant="h6" gutterBottom>
          4Set
        </Typography>
        <Typography variant="body1" gutterBottom>
          In 4Set, each feature has <strong>four</strong> variants instead of
          three.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="2130" />
          <SetCard value="3201" />
          <SetCard value="0312" />
          <SetCard value="1023" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          A <em>4Set</em> is a combination of four cards such that for each of
          the four features, the variants are either{" "}
          <strong>all the same, all different, or form two pairs</strong>. In
          other words, combinations like <code>AAAA</code>, <code>ABCD</code>{" "}
          and <code>AABB</code> form 4Sets, while <code>AAAB</code> and{" "}
          <code>ABCC</code> do not. For example, the four cards shown above form
          a 4Set, because each feature appears in all four variants.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Like in the standard Set, each feature is taken separately: some may
          be all the same, while others are all different or pairs. Below are a
          few more examples of 4Sets:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="1102" />
          <SetCard value="1101" />
          <SetCard value="1202" />
          <SetCard value="1201" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="3101" />
          <SetCard value="1201" />
          <SetCard value="2231" />
          <SetCard value="0131" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="2310" />
          <SetCard value="1200" />
          <SetCard value="1132" />
          <SetCard value="2022" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          The four cards below do <strong>not</strong> form a 4Set:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="0001" />
          <SetCard value="0102" />
          <SetCard value="0200" />
          <SetCard value="1300" />
        </Typography>
        <Typography variant="body1" gutterBottom>
          The colors form the <code>AAAB</code> pattern and counts form the{" "}
          <code>ABCC</code>. In general, four cards do not form a 4Set if, for
          any of the features, any two cards are different and the other two are
          not.
        </Typography>
        <Typography variant="body1" gutterBottom>
          This mode is pretty hard: 4Sets are harder to find than regular Sets
          and there are 4<sup>4</sup> = 256 cards in the deck. If you are new to
          this mode, we recommend starting with 4Set Junior.
        </Typography>
        <Typography variant="h6" gutterBottom>
          4Set Junior
        </Typography>
        <Typography variant="body1" gutterBottom>
          4Set Junior is a simplified version of 4Set that only uses cards with
          solid shading. This means that every card has only{" "}
          <strong>three</strong> features instead of four, making it a good
          place to start playing 4Set.
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="200" />
          <SetCard value="311" />
          <SetCard value="022" />
          <SetCard value="133" />
        </Typography>
        <Typography variant="h6" gutterBottom>
          4Set Junior-Chain
        </Typography>
        <Typography variant="body1" gutterBottom>
          Chain your (junior) 4Sets. After you pick the first 4Set, every new
          4Set should have{" "}
          <strong>exactly two cards from the previous 4Set</strong>. For
          example, the first three 4Sets of a game might look as follows:
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="200" />
          <SetCard value="311" />
          <SetCard value="022" />
          <SetCard value="133" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="311" />
          <SetCard value="022" />
          <SetCard value="011" />
          <SetCard value="322" />
        </Typography>
        <Typography component="div" align="center" gutterBottom>
          <SetCard value="311" />
          <SetCard value="322" />
          <SetCard value="123" />
          <SetCard value="110" />
        </Typography>
        <Typography variant="h6" gutterBottom>
          Puzzle
        </Typography>
        <Typography variant="body1" gutterBottom>
          This mode is inspired by{" "}
          <Link href="https://www.setgame.com/set/puzzle">
            The Daily SET Puzzle website
          </Link>
          . The rules are the same as in the standard Set, except that you have
          to find <strong>all sets</strong> on each board before you move to the
          next board.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Shuffle
        </Typography>
        <Typography variant="body1" gutterBottom>
          Shuffle follows the same rules as the standard Set; the only
          difference being that all cards on the board are shuffled when a Set
          is found.
        </Typography>
        <Typography variant="h6" gutterBottom>
          Memory
        </Typography>
        <Typography variant="body1" gutterBottom>
          <strong>
            Memory game mode is experimental and details are likely to change in
            the future.
          </strong>
        </Typography>
        <Typography variant="body1" gutterBottom>
          This variant is a hybrid of Set with the game{" "}
          <Link href="https://en.wikipedia.org/wiki/Concentration_(card_game)">
            Memory
          </Link>
          . The rules are the same as in the standard Set, but all cards are
          dealt face down. Players reveal 3 cards at a time. If revealed cards
          form a Set, it is taken as usual. Otherwise, the cards are turned face
          down again, and the players make another attempt.
        </Typography>
        <hr />

        <Typography variant="h5" gutterBottom>
          Rating system
        </Typography>
        <Typography variant="body1" gutterBottom>
          Set with Forks includes a rating system based on the well known Elo
          system. The system assigns a number to every player, and updates its
          value based on your performance compared to your opponents. The
          ratings are tracked separately for each game mode.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Like in chess, each player initially starts with a rating of{" "}
          {BASE_RATING}. The update to each player's rating is based on the
          fraction of the sets they obtain, and the ratings of the other players
          in the game. Let{" "}
          <em>
            R<sub>i</sub>
          </em>{" "}
          be the rating of player <em>i</em>. In the calculation of the expected
          ratio of sets obtained, we scale the ratings exponentially such that a
          player with a rating {SCALING_FACTOR} points higher is expected to
          obtain approximately 10 times as many sets.{" "}
          <em>
            Q<sub>i</sub>
          </em>
          , the exponentially scaled rating of player <em>i</em>, is computed
          using
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          <em>
            Q<sub>i</sub> = 10
            <sup>
              R<sub>i</sub> / {SCALING_FACTOR}
            </sup>
            .
          </em>
        </Typography>
        <Typography variant="body1" gutterBottom>
          For each player in a game, we then compute the expected ratio of sets
          for that player using the formula
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          <em>
            E<sub>i</sub> = Q<sub>i</sub> / (Σ Q<sub>j</sub>){", "}
          </em>
        </Typography>
        <Typography variant="body1" gutterBottom>
          where{" "}
          <em>
            Σ Q<sub>j</sub>
          </em>{" "}
          is a sum over the exponentially scaled ratings of all players in the
          game.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Finally, we compute the updated rating,{" "}
          <em>
            R<sub>i</sub>'
          </em>
          , for each player using the formula
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          <em>
            R<sub>i</sub>' = R<sub>i</sub> + K·(S<sub>i</sub> - E<sub>i</sub>)
            {", "}
          </em>
        </Typography>
        <Typography variant="body1" gutterBottom>
          where{" "}
          <em>
            S<sub>i</sub>
          </em>{" "}
          is the achieved ratio of sets obtained by player <em>i</em> and{" "}
          <em>K</em> is an additional factor based on your level of experience.
        </Typography>
        <Typography variant="body1" gutterBottom>
          Note that while the rating is displayed as an integer, it is stored
          and computed as a floating-point number.
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

export default HelpPage;
