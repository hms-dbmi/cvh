const SUPPORTED_TOOLS = [
    'Gosling',
]

// Gosling constants

const GOSLING_FILE_TYPES = [
    "CSV",
    "GFF3",
    "VCF",
    "JSON",
    "BigWig",
    "BAM",
    "BED",
] as const;

type GoslingFileTypes = (typeof GOSLING_FILE_TYPES)[number];

const isGoslingFileType = (fileType: string): fileType is GoslingFileTypes => {
    return GOSLING_FILE_TYPES.includes(fileType as GoslingFileTypes);
}

// In the future, when other tools are supported, this list should be expanded to include those file types as well.
const SUPPORTED_FILE_TYPES = [...new Set([...GOSLING_FILE_TYPES])] as const;

type SupportedFileTypes = (typeof SUPPORTED_FILE_TYPES)[number];

const isSupportedFileType = (fileType: string): fileType is SupportedFileTypes => {
    return SUPPORTED_FILE_TYPES.includes(fileType as SupportedFileTypes);
};


export { SUPPORTED_TOOLS, SUPPORTED_FILE_TYPES, isSupportedFileType, GOSLING_FILE_TYPES, isGoslingFileType };

export type { SupportedFileTypes, GoslingFileTypes };