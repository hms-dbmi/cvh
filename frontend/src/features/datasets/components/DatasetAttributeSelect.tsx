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

export default function DatasetAttributeSelect({
  label,
  values,
  selectedValues,
  setSelectedValues,
  attribute,
}: {
  label: string;
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
      typeof value === "string" ? value.split(",") : value,
    );
  };

  return (
    <Box>
      <FormControl sx={{ width: "100%" }}>
        <Select<string[]>
          labelId={`${attribute}-select-label`}
          id={`${attribute}-select`}
          multiple
          value={selectedValues}
          onChange={handleChange}
          IconComponent={(props) => <CaretDown size={16} {...props} />}
          disabled={values.length === 0}
          input={
            <InputBase
              sx={(theme) => ({
                borderRadius: "4px",
                padding: "4px 8px",
                border: `1px solid ${theme.palette.grey[300]}`,
                background: "#F8F8F8",
                [`#${attribute}-select`]: {
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
              {label}{" "}
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
