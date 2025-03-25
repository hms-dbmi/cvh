import { z } from 'zod';
import { SUPPORTED_FILE_TYPES } from '../../const';

/****** Gosling Data Source Schemas *******/

const genomicFieldsToConvertSchema = z.object({
    chromosomeField: z.string(),
    genomicFields: z.array(z.string()),
}).required();

/**
 * Schema for Gosling CSV data source configuration
 */
export const goslingCSVDataSourceSchema = z.object({gosling: z.object(({
    separator: z.string().max(5),
    sample_length: z.number().int().default(1000),
    long_to_wide_id: z.string().max(100),
    header_names: z.array(z.string()),
    genomic_fields_to_convert: z.array(genomicFieldsToConvertSchema),
    genomic_fields: z.array(z.string()),
    chromosome_prefix: z.string().max(50),
    chromosome_field: z.string().max(50),
}))}).required();

/**
 * Schema for Gosling GFF3 data source configuration
 */
export const goslingGGF3SourceConfigSchema = z.object({gosling: z.object(({
    index_url: z.string().url().max(100),
    sample_length: z.number().int().default(1000),
    attributes_to_fields: z.array(
        z.object({
            attribute: z.string(),
            defaultValue: z.string(),
        })
    )
}))}).required();

/**
 * Schema for Gosling VCF data source configuration
 */
export const goslingVCFDataSourceConfigSchema = z.object({gosling: z.object(({
    index_url: z.string().url().max(100),
    sample_length: z.number().int().default(1000),
}))}).required();

/**
 * Schema for Gosling JSON data source configuration
 */
export const goslingJSONSourceConfigSchema = z.object({gosling: z.object(({
    sample_length: z.number().int().default(1000),
    genomic_fields_to_convert: z.array(genomicFieldsToConvertSchema),
    genomic_fields: z.array(z.string()), // list of strings
    chromosome_field: z.string().max(50),
}))}).required();

/**
 * Schema for Gosling BigWig data source configuration
 */
export const goslingBigWigSourceConfigSchema = z.object({gosling: z.object(({
    value: z.string().max(100).default("value"),
    start: z.string().max(100).default("start"),
    end: z.string().max(100).default("end"),
    column: z.string().max(100).default("position"),
    bin_size: z.number().int().default(1), // Binning the genomic interval in tiles (unit size: 256).
    aggregation: z.enum(["mean", "sum"]).default("mean"), // Aggregation method for the values in each tile. Options: "mean", "sum"
}))}).required();

/**
 * Schema for Gosling BAM data source configuration
 */
export const goslingBAMSourceConfigSchema = z.object({gosling: z.object(({
    index_url: z.string().url().max(100),
    max_insert_size: z.number().int().default(5000),
    load_mates: z.boolean().default(false),
    junction_min_coverage: z.number().int().default(1),
    extract_junction: z.boolean().default(false),
}))}).required();

/**
 * Schema for Gosling BED data source configuration
 */
export const goslingBEDSourceConfigSchema = z.object({
    index_url: z.string().url().max(100),
    sample_length: z.number().int().default(1000),
    custom_fields: z.array(z.string()),
}).required();

/**
 * Mapping of file types to their respective schemas for validation
 */
export const dataSourceSchema = z
    .object({
        name: z.string().default(""),
        description: z.string().default(""),
        source_url: z.string().default(""),
        file_type: z.enum(["", ...SUPPORTED_FILE_TYPES]).default(""),
        data_type: z.string().default(""),
        selected_tools: z.array(z.string()).default([]),
    })
    .and(
        // Ensure that the selected_tools array includes "gosling" to activate the appropriate schema
        // TODO: Figure out how to make this more dynamic for future tools
        z.preprocess(
            (data) => {
                const parsed = z.object({ selected_tools: z.array(z.string()).default([]) }).safeParse(data);
                return parsed.success && parsed.data.selected_tools.includes("gosling") ? data : null;
            },
            z.discriminatedUnion("file_type", [
                z.object({ file_type: z.literal("CSV") }).merge(goslingCSVDataSourceSchema),
                z.object({ file_type: z.literal("GFF3") }).merge(goslingGGF3SourceConfigSchema),
                z.object({ file_type: z.literal("VCF") }).merge(goslingVCFDataSourceConfigSchema),
                z.object({ file_type: z.literal("JSON") }).merge(goslingJSONSourceConfigSchema),
                z.object({ file_type: z.literal("BigWig") }).merge(goslingBigWigSourceConfigSchema),
                z.object({ file_type: z.literal("BAM") }).merge(goslingBAMSourceConfigSchema),
                z.object({ file_type: z.literal("BED") }).merge(goslingBEDSourceConfigSchema),
            ])
        )
    );

export type DataSourceSchema = z.infer<typeof dataSourceSchema>;