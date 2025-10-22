import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";

import type { components } from "../../../types/schema";

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

    console.log(values, selectedValues, parsedValues)
    setSelectedValues(parsedValues);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <FormControl sx={{ width: "100%" }}>
        <InputLabel id={`${attribute}-select-label`}>{attribute}</InputLabel>
        <Select<string[]>
          labelId={`${attribute}-select-label`}
          id={`${attribute}-select`}
          multiple
          value={selectedValues}
          onChange={handleChange}
          input={<OutlinedInput label={attribute} />}
          renderValue={(selected) => selected.join(", ")}
        >
          {values.map((v) => (
            <MenuItem key={v?.key + v?.tag} value={v.uuid}>
              <Checkbox checked={Boolean(v?.uuid && selectedValues.includes(v?.uuid))} />
              <ListItemText primary={v?.key + v?.tag} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
