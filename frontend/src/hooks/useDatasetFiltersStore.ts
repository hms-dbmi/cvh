import { create } from "zustand";

export interface DatasetFiltersState {
  selectedAssemblies: string[],
  selectedFileTypes: string[],
  selectedTags: string[]
  nameSubstring: string;
  setSelectedAssemblies: (assemblies: string[]) => void;
  setSelectedFileTypes: (fileTypes: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setNameSubstring: (name: string) => void;
}


const useStore = create<DatasetFiltersState>((set) => ({
  nameSubstring: '',
  selectedAssemblies: [],
  selectedFileTypes: [],
  selectedTags: [],
  setSelectedAssemblies: (assemblies) => {
    set({
      selectedAssemblies: assemblies
    });
  },
  setSelectedFileTypes: (fileTypes) => {
    set({
      selectedFileTypes: fileTypes
    });
  },
  setSelectedTags: (tags) => {
    set({
      selectedTags: tags
    });
  },
  setNameSubstring: (name) => {
    set({
      nameSubstring: name
    });
  },
}));

export { useStore as useDatasetFiltersStore };
