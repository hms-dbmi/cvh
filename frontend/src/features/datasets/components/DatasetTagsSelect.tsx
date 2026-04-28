import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputBase from "@mui/material/InputBase";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretDown } from "@phosphor-icons/react";
import type { components } from "@/types/schema";

type Tag = components["schemas"]["TagOut"];

export default function DatasetTagsSelect({
  values,
  selectedValues,
  setSelectedValues,
  attribute,
}: {
  attribute: "tags";
  values: Tag[];
  selectedValues: string[];
  setSelectedValues: (tags: string[]) => void;
}) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    // On autofill we get a stringified value.
    const parsedValues = typeof value === "string" ? value.split(",") : value;
    setSelectedValues(parsedValues);
  };

  return (
    <Box>
      <FormControl>
        <Select<string[]>
          labelId={`${attribute}-select-label`}
          id={`${attribute}-select`}
          multiple
          value={selectedValues}
          onChange={handleChange}
          disabled={values.length === 0}
          IconComponent={(props) => <CaretDown size={16} {...props} />}
          input={
            <InputBase
              sx={(theme) => ({
                borderRadius: "4px",
                padding: "4px 8px",
                border: `1px solid ${theme.palette.grey[300]}`,
                background: "#F8F8F8",
                "#tags-select": {
                  paddingRight: 0,
                },
              })}
            />
          }
          renderValue={(selected) => (
            <Typography
              component={Stack}
              variant="subtitle2"
              direction="row"
              alignItems="center"
              sx={{ height: 20 }}
            >
              Tags{" "}
              {selected?.length > 0 ? (
                <Typography
                  component={Box}
                  variant="subtitle2"
                  sx={{
                    backgroundColor: "black",
                    color: "white",
                    height: 20,
                    width: 20,
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    ml: 0.5,
                  }}
                >
                  {selected.length}
                </Typography>
              ) : (
                <Box height={20} width={20} aria-hidden />
              )}
            </Typography>
          )}
          displayEmpty
        >
          {values.map((v) => (
            <MenuItem key={v?.key + v?.tag} value={v.uuid}>
              <Checkbox
                checked={Boolean(v?.uuid && selectedValues.includes(v?.uuid))}
              />
              <ListItemText
                primary={
                  <>
                    <Typography
                      component="span"
                      variant="subtitle1"
                      sx={{ fontSize: 14 }}
                    >
                      {v?.key}
                    </Typography>{" "}
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ fontSize: 14 }}
                    >
                      {v?.tag}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
