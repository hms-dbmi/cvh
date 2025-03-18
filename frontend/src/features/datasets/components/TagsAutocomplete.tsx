import { useState, SyntheticEvent, SetStateAction, Dispatch } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { useGetTags } from "../api/useTags";

type Props = {
  selectedTags: { tag: string }[];
  setSelectedTags: Dispatch<
    SetStateAction<
      {
        tag: string;
      }[]
    >
  >;
};

function TagsAutocomplete({ selectedTags, setSelectedTags }: Props) {
  const { data } = useGetTags();

  const [inputValue, setInputValue] = useState("");
  return (
    <Autocomplete
      multiple
      value={selectedTags}
      onChange={(_: SyntheticEvent, newValue: { tag: string }[]) => {
        setSelectedTags(newValue);
      }}
      inputValue={inputValue}
      onInputChange={(_: SyntheticEvent, newInputValue) => {
        setInputValue(newInputValue);
      }}
      id="tags-autocomplete"
      options={data?.items ?? []}
      getOptionLabel={(option) => option?.tag}
      filterSelectedOptions
      renderInput={(params) => (
        <TextField {...params} label="Tags" placeholder="e.g. bigWig" />
      )}
    />
  );
}

export default TagsAutocomplete;
