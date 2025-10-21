import OutlinedInput from "@mui/material/OutlinedInput";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import ListItemText from "@mui/material/ListItemText";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import Checkbox from "@mui/material/Checkbox";
import Box from "@mui/material/Box";

export default function DatasetAttributeSelect({
  values,
  selectedValues,
  setSelectedValues,
  attribute,
}: {
  attribute: string;
  values: string[];
  selectedValues: string[];
  setSelectedValues: (v: string[]) => void;
}) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const {
      target: { value },
    } = event;
    setSelectedValues(
      // On autofill we get a stringified value.
      typeof value === "string" ? value.split(",") : value
    );
  };

  return (
    <Box sx={{ flexGrow: 1}}>
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
          // MenuProps={MenuProps}
        >
          {values.map((v) => (
            <MenuItem key={v} value={v}>
              <Checkbox checked={selectedValues.includes(v)} />
              <ListItemText primary={v} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
