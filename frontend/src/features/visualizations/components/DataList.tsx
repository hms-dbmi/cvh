import { useState } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import type { components } from "../../../types/schema";
import AddDatasetButton from "../../datasets/components/AddDatasetButton";

function ActionsMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
      >
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Edit Details
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <ContentCopyOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Create a Copy
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <DeleteOutlinedIcon fontSize="small" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}

function DataList({
  projectId,
  datasets,
}: {
  projectId: string;
  datasets?: components["schemas"]["DatasetOut"][];
}) {
  const [input, setInput] = useState<string>("");

  if (!datasets) {
    return null;
  }
  return (
    <Stack spacing={0.75}>
      <TextField
        value={input}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setInput(event.target.value);
        }}
        id="tags-autocomplete"
        fullWidth
        placeholder="Search for a dataset..."
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <FilterAltIcon />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Stack direction="row" spacing={1}>
        <AddDatasetButton projectId={projectId} />
        <Button startIcon={<OpenInFullIcon />} variant="outlined">
          View All
        </Button>
      </Stack>
      {/*<List>
        {datasets
          ?.filter((d) => {
            if (input.length) {
              return d.name.includes(input);
            }
            return true;
          })
          .map((v) => (
            <ListItem disablePadding secondaryAction={<ActionsMenu />}>
              <ListItemButton>
                <ListItemText
                  primary={v.name}
                  secondary={[v.source_url, "updated 2 hours ago"].map((t) => (
                    <>{t} &middot; </>
                  ))}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>*/}
    </Stack>
  );
}

export default function DataAccordion({
  projectId,
  datasets,
}: {
  projectId: string;
  datasets?: components["schemas"]["DatasetOut"][];
}) {
  return (
    <Accordion disableGutters>
      <AccordionSummary
        expandIcon={<ArrowDropDownIcon />}
        aria-controls="panel1-content"
        id="panel1-header"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <DescriptionOutlinedIcon />
          <Typography variant="h6" ml={1} component="span">
            DATASETS
          </Typography>
          <Typography variant="body2" component="span" color="textSecondary">
            {datasets?.length} dataset{datasets?.length === 1 ? "" : "s"}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <DataList projectId={projectId} datasets={datasets} />
      </AccordionDetails>
    </Accordion>
  );
}
