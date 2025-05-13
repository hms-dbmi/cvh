import { useState, SyntheticEvent, SetStateAction, Dispatch } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

import { useGetTags } from "../api/useTags";
import type { components } from "../../../types/schema";

type TagsType = components["schemas"]["TagOut"][];

type Props = {
  selectedTags: TagsType;
  setSelectedTags: Dispatch<SetStateAction<TagsType>>;
};

function TagsAutocomplete({ selectedTags, setSelectedTags }: Props) {
  const [inputValue, setInputValue] = useState("");
  const { data } = useGetTags(inputValue);

  return (
    <Autocomplete
      multiple
      value={selectedTags}
      onChange={(_: SyntheticEvent, newValue: TagsType) => {
        setSelectedTags(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(_: SyntheticEvent, newInputValue) => {
        setInputValue(newInputValue);
      }}
      id="tags-autocomplete"
      options={data?.items ?? []}
      getOptionLabel={(option) => `${option?.key}:${option.tag}`}
      filterSelectedOptions
      renderInput={(params) => (
        <TextField {...params} label="Tags" placeholder="e.g. bigWig" />
      )}
    />
  );
}

export default TagsAutocomplete;
