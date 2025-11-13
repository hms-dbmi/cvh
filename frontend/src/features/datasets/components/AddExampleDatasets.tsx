import { useCallback, useState } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import DialogButton from "../../../components/DialogButton";
import { Typography } from "@mui/material";
import { useAddExample } from "../api/useExamples";

const text = {
  button: "Example Data Sources",
  title: "Example Data Sources",
};

function ExampleDataSource({
  setSelectedExample,
  selectedExample,
  exampleID,
  title,
  description,
  fileTypes,
  imageSrc,
  dataSources,
}: {
  setSelectedExample: React.Dispatch<
    React.SetStateAction<1 | 2 | 3 | undefined>
  >;
  exampleID: 1 | 2 | 3;
  selectedExample?: 1 | 2 | 3;
  title: string;
  description: string;
  fileTypes: string[];
  imageSrc: string;
  dataSources: string[];
}) {
  const select = useCallback(
    () => setSelectedExample(exampleID),
    [setSelectedExample, exampleID]
  );

  const isSelected = exampleID === selectedExample;

  return (
    <Stack
      onClick={select}
      width="calc(100% / 3)"
      spacing={1}
      sx={{
        borderRadius: "4px",
        padding: "12px",
        boxShadow: isSelected
          ? "-2px -2px 14.3px 0 rgba(14, 207, 255, 0.15), 4px 4px 20px 0 rgba(160, 246, 136, 0.15)"
          : "none",
        border: isSelected ? "2px solid black" : "2px solid transparent",
        mb: 1,
      }}
    >
      <Typography variant="h6" component="p">
        {title}
      </Typography>
      <Typography variant="body2">{description}</Typography>
      <Typography variant="body2" sx={{ color: "#4E5A63" }}>
        {fileTypes.map((t) => (
          <>{t} &middot;</>
        ))}
      </Typography>
      <Box
        component="img"
        sx={{
          backgroundColor: "#fff",
          borderRadius: "16px 16px 0 16px",
          padding: 1,
        }}
        width="100%"
        height="auto"
        src={`${import.meta.env.VITE_CLOUDFRONT_URL}/${imageSrc}`}
      />
      <Typography variant="h6" component="p">
        Included Datasets
      </Typography>
      <Stack spacing={1}>
        {dataSources.map((s) => (
          <Typography sx={{ overflowWrap: "break-word" }} variant="body2">
            {s}
          </Typography>
        ))}
      </Stack>
    </Stack>
  );
}

const examples: {
  exampleID: 1 | 2 | 3;
  title: string;
  description: string;
  fileTypes: string[];
  dataSources: string[];
  imageSrc: string;
}[] = [
  {
    exampleID: 1,
    title: "Two Basic Views",
    description:
      "Visualizing generic genomic data in linear and circular layouts.",
    fileTypes: ["bigWig", "bedpe", "multivec"],
    dataSources: [
      "HFFc6_H3K4me3.bigWig",
      "cistrome-multivec",
      "SRR7890905.gripss.filtered.bedpe",
    ],
    imageSrc: "basicView.png",
  },
  {
    exampleID: 2,
    title: "3D and HiC Matrix",
    description:
      "Interactive visualization showing 3D genome structures of single diploid human cells.",
    fileTypes: ["csv", "cooler"],
    dataSources: ["Tan-2018_GSM3271347_gm12878_01.csv", "hffc6-hic-hg38"],
    imageSrc: "hic_3d.png",
  },
  {
    exampleID: 3,
    title: "Corces (diff title)",
    description:
      "From Corces et al. (2020) (PMID: 33106633), this is an interactive overview-and-details visualization of single-cell epigenomic data, featuring a chromosome cytoband overview and epigenetic signal display at the ITIH1 locus.",
    fileTypes: ["bigWig", "beddb", "csv"],
    dataSources: [
      "cytogenetic_band.csv",
      "InhibitoryNeurons-insertions_bin100_RIPnorm.bw",
      "DopaNeurons_Cluster10_AllFrags_projSUNI2_insertions_bin100_RIPnorm.bw",
      "Microglia-insertions_bin100_RIPnorm.bw",
      "Oligodendrocytes-insertions_bin100_RIPnorm.bw",
      "Astrocytes-insertions_bin100_RIPnorm.bw",
      "OPCs-insertions_bin100_RIPnorm.bw",
      "gene-annotation",
    ],
    imageSrc: "corces.png",
  },
];

export default function AddExamplesDatasets({
  project_uuid,
}: {
  project_uuid: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedExample, setSelectedExample] = useState<1 | 2 | 3>();

  const { mutate } = useAddExample();

  const addExample = useCallback(() => {
    if (selectedExample) {
      mutate({
        body: {
          example_id: selectedExample,
          project_uuid,
          include_visualizations: false,
        },
      });
    }
  }, [selectedExample, project_uuid, mutate]);

  const addExampleWithViz = useCallback(() => {
    if (selectedExample) {
      mutate({
        body: {
          example_id: selectedExample,
          project_uuid,
          include_visualizations: true,
        },
      });
    }
  }, [selectedExample, project_uuid, mutate]);

  return (
    <DialogButton
      open={open}
      setOpen={setOpen}
      text={text}
      isForm={false}
      closeButtonProps={{ variant: "text" }}
      actionButtons={
        <Stack spacing={1} direction="row">
          <Button
            variant="outlined"
            sx={{ padding: "12px 16px", borderRadius: "8px" }}
            onClick={addExampleWithViz}
          >
            Add Selected Data Sources + Visualizations
          </Button>
          <Button
            variant="contained"
            sx={{ padding: "12px 16px", borderRadius: "8px" }}
            onClick={addExample}
          >
            Add Selected Data Sources to Workspace
          </Button>
        </Stack>
      }
    >
      <Stack spacing={1} mt={2} direction="row" sx={{ overflowY: "auto" }}>
        {examples.map((example) => (
          <ExampleDataSource
            key={example.title}
            {...example}
            selectedExample={selectedExample}
            setSelectedExample={setSelectedExample}
          />
        ))}
      </Stack>
    </DialogButton>
  );
}
