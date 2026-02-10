import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import formatISO from "../utils/formatISO";

type Props = { created?: string; modified?: string };

function EntityDates({ created, modified }: Props) {
  return (
    <Stack direction="row" spacing={2} justifyContent="flex-end" mt={1}>
      {created && (
        <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
          Created: {formatISO(created)}
        </Typography>
      )}
      {modified && (
        <Typography variant="body2" sx={{ color: "text.primary" }} noWrap>
          Modified: {formatISO(modified)}
        </Typography>
      )}
    </Stack>
  );
}

export default EntityDates;
