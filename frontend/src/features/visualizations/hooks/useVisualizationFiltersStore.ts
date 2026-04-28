import { create } from "zustand";

export interface DatasetFiltersState {
  selectedTags: string[];
  nameSubstring: string;
  setSelectedTags: (tags: string[]) => void;
  setNameSubstring: (name: string) => void;
}

const useStore = create<DatasetFiltersState>((set) => ({
  nameSubstring: "",
  selectedTags: [],
  setSelectedTags: (tags) => {
    set({
      selectedTags: tags,
    });
  },
  setNameSubstring: (name) => {
    set({
      nameSubstring: name,
    });
  },
}));

export { useStore as useVisualizationFiltersStore };
