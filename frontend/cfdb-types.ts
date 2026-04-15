import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null | undefined;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  JSON: { input: any; output: any; }
  ObjectIdScalar: { input: any; output: any; }
};

export type AnatomyInput = {
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type AnatomyType = {
  __typename?: 'AnatomyType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AssayTypeInput = {
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type AssayTypeType = {
  __typename?: 'AssayTypeType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type BiosampleInput = {
  anatomy?: InputMaybe<Array<AnatomyInput>>;
  biofluid?: InputMaybe<Array<Scalars['String']['input']>>;
  creationTime?: InputMaybe<Array<Scalars['String']['input']>>;
  extra?: InputMaybe<Array<EnrichedBiosampleInput>>;
  idNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  localId?: InputMaybe<Array<Scalars['String']['input']>>;
  persistentId?: InputMaybe<Array<Scalars['String']['input']>>;
  projectIdNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  projectLocalId?: InputMaybe<Array<Scalars['String']['input']>>;
  samplePrepMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  subjects?: InputMaybe<Array<SubjectInput>>;
};

export type BiosampleType = {
  __typename?: 'BiosampleType';
  anatomy?: Maybe<AnatomyType>;
  biofluid?: Maybe<Scalars['String']['output']>;
  creationTime?: Maybe<Scalars['String']['output']>;
  extra?: Maybe<EnrichedBiosampleType>;
  idNamespace: Scalars['String']['output'];
  localId: Scalars['String']['output'];
  persistentId?: Maybe<Scalars['String']['output']>;
  projectIdNamespace: Scalars['String']['output'];
  projectLocalId: Scalars['String']['output'];
  samplePrepMethod?: Maybe<Scalars['String']['output']>;
  subjects: Array<SubjectType>;
};

export type CollectionInput = {
  abbreviation?: InputMaybe<Array<Scalars['String']['input']>>;
  analyteClass?: InputMaybe<Array<Scalars['String']['input']>>;
  anatomy?: InputMaybe<Array<AnatomyInput>>;
  biosamples?: InputMaybe<Array<BiosampleInput>>;
  creationTime?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  experimentTarget?: InputMaybe<Array<Scalars['String']['input']>>;
  experimentType?: InputMaybe<Array<Scalars['String']['input']>>;
  extra?: InputMaybe<Array<EnrichedCollectionInput>>;
  idNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  lab?: InputMaybe<Array<Scalars['String']['input']>>;
  localId?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
  persistentId?: InputMaybe<Array<Scalars['String']['input']>>;
  subjects?: InputMaybe<Array<SubjectInput>>;
};

export type CollectionType = {
  __typename?: 'CollectionType';
  abbreviation?: Maybe<Scalars['String']['output']>;
  analyteClass?: Maybe<Scalars['String']['output']>;
  anatomy: Array<AnatomyType>;
  biosamples: Array<BiosampleType>;
  creationTime?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  experimentTarget?: Maybe<Scalars['String']['output']>;
  experimentType?: Maybe<Scalars['String']['output']>;
  extra?: Maybe<EnrichedCollectionType>;
  idNamespace: Scalars['String']['output'];
  lab?: Maybe<Scalars['String']['output']>;
  localId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  persistentId?: Maybe<Scalars['String']['output']>;
  subjects: Array<SubjectType>;
};

export type DataTypeInput = {
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type DataTypeType = {
  __typename?: 'DataTypeType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type DccInput = {
  contactEmail?: InputMaybe<Array<Scalars['String']['input']>>;
  contactName?: InputMaybe<Array<Scalars['String']['input']>>;
  dccAbbreviation?: InputMaybe<Array<Scalars['String']['input']>>;
  dccDescription?: InputMaybe<Array<Scalars['String']['input']>>;
  dccName?: InputMaybe<Array<Scalars['String']['input']>>;
  dccUrl?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  projectIdNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  projectLocalId?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type DccType = {
  __typename?: 'DccType';
  contactEmail: Scalars['String']['output'];
  contactName: Scalars['String']['output'];
  dccAbbreviation: Scalars['String']['output'];
  dccDescription?: Maybe<Scalars['String']['output']>;
  dccName: Scalars['String']['output'];
  dccUrl: Scalars['String']['output'];
  id: Scalars['String']['output'];
  projectIdNamespace: Scalars['String']['output'];
  projectLocalId: Scalars['String']['output'];
};

export type DistinctFieldType = {
  __typename?: 'DistinctFieldType';
  field: Scalars['String']['output'];
  values: Scalars['JSON']['output'];
};

export type EnrichedBiosampleInput = {
  encode?: InputMaybe<Array<EnrichedEncodeBiosampleInput>>;
};

export type EnrichedBiosampleType = {
  __typename?: 'EnrichedBiosampleType';
  encode?: Maybe<EnrichedEncodeBiosampleType>;
};

export type EnrichedCollectionInput = {
  encode?: InputMaybe<Array<EnrichedEncodeCollectionInput>>;
  fourdn?: InputMaybe<Array<EnrichedFourdnCollectionInput>>;
  hubmap?: InputMaybe<Array<EnrichedHubmapCollectionInput>>;
};

export type EnrichedCollectionType = {
  __typename?: 'EnrichedCollectionType';
  encode?: Maybe<EnrichedEncodeCollectionType>;
  fourdn?: Maybe<EnrichedFourdnCollectionType>;
  hubmap?: Maybe<EnrichedHubmapCollectionType>;
};

export type EnrichedEncodeBiosampleInput = {
  biosampleGeneticModifications?: InputMaybe<Array<Scalars['String']['input']>>;
  biosampleTreatments?: InputMaybe<Array<Scalars['String']['input']>>;
  biosampleTreatmentsAmount?: InputMaybe<Array<Scalars['String']['input']>>;
  biosampleTreatmentsDuration?: InputMaybe<Array<Scalars['String']['input']>>;
  biosampleType?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryCrosslinkingMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryDepletedIn?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryExtractionMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryFragmentationMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryLysisMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryMadeFrom?: InputMaybe<Array<Scalars['String']['input']>>;
  librarySizeRange?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryStrandSpecific?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedEncodeBiosampleType = {
  __typename?: 'EnrichedEncodeBiosampleType';
  biosampleGeneticModifications?: Maybe<Scalars['String']['output']>;
  biosampleTreatments?: Maybe<Scalars['String']['output']>;
  biosampleTreatmentsAmount?: Maybe<Scalars['String']['output']>;
  biosampleTreatmentsDuration?: Maybe<Scalars['String']['output']>;
  biosampleType?: Maybe<Scalars['String']['output']>;
  libraryCrosslinkingMethod?: Maybe<Scalars['String']['output']>;
  libraryDepletedIn?: Maybe<Scalars['String']['output']>;
  libraryExtractionMethod?: Maybe<Scalars['String']['output']>;
  libraryFragmentationMethod?: Maybe<Scalars['String']['output']>;
  libraryLysisMethod?: Maybe<Scalars['String']['output']>;
  libraryMadeFrom?: Maybe<Scalars['String']['output']>;
  librarySizeRange?: Maybe<Scalars['String']['output']>;
  libraryStrandSpecific?: Maybe<Scalars['String']['output']>;
};

export type EnrichedEncodeCollectionInput = {
  dbxrefs?: InputMaybe<Array<Scalars['String']['input']>>;
  experimentTarget?: InputMaybe<Array<Scalars['String']['input']>>;
  platform?: InputMaybe<Array<Scalars['String']['input']>>;
  project?: InputMaybe<Array<Scalars['String']['input']>>;
  rbnsProteinConcentration?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedEncodeCollectionType = {
  __typename?: 'EnrichedEncodeCollectionType';
  dbxrefs?: Maybe<Scalars['String']['output']>;
  platform?: Maybe<Scalars['String']['output']>;
  project?: Maybe<Scalars['String']['output']>;
  rbnsProteinConcentration?: Maybe<Scalars['String']['output']>;
};

export type EnrichedEncodeFileInput = {
  assembly?: InputMaybe<Array<Scalars['String']['input']>>;
  auditError?: InputMaybe<Array<Scalars['String']['input']>>;
  auditNotCompliant?: InputMaybe<Array<Scalars['String']['input']>>;
  auditWarning?: InputMaybe<Array<Scalars['String']['input']>>;
  azureUrl?: InputMaybe<Array<Scalars['String']['input']>>;
  controlledBy?: InputMaybe<Array<Scalars['String']['input']>>;
  derivedFrom?: InputMaybe<Array<Scalars['String']['input']>>;
  fileAnalysisStatus?: InputMaybe<Array<Scalars['String']['input']>>;
  fileAnalysisTitle?: InputMaybe<Array<Scalars['String']['input']>>;
  fileFormatType?: InputMaybe<Array<Scalars['String']['input']>>;
  genomeAnnotation?: InputMaybe<Array<Scalars['String']['input']>>;
  indexOf?: InputMaybe<Array<Scalars['String']['input']>>;
  mappedReadLength?: InputMaybe<Array<Scalars['String']['input']>>;
  outputType?: InputMaybe<Array<Scalars['String']['input']>>;
  pairedEnd?: InputMaybe<Array<Scalars['String']['input']>>;
  pairedWith?: InputMaybe<Array<Scalars['String']['input']>>;
  readLength?: InputMaybe<Array<Scalars['String']['input']>>;
  runType?: InputMaybe<Array<Scalars['String']['input']>>;
  s3Uri?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedEncodeFileType = {
  __typename?: 'EnrichedEncodeFileType';
  assembly?: Maybe<Scalars['String']['output']>;
  auditError?: Maybe<Scalars['String']['output']>;
  auditNotCompliant?: Maybe<Scalars['String']['output']>;
  auditWarning?: Maybe<Scalars['String']['output']>;
  azureUrl?: Maybe<Scalars['String']['output']>;
  biologicalReplicates?: Maybe<Scalars['String']['output']>;
  controlledBy?: Maybe<Scalars['String']['output']>;
  derivedFrom?: Maybe<Scalars['String']['output']>;
  fileAnalysisStatus?: Maybe<Scalars['String']['output']>;
  fileAnalysisTitle?: Maybe<Scalars['String']['output']>;
  fileFormatType?: Maybe<Scalars['String']['output']>;
  genomeAnnotation?: Maybe<Scalars['String']['output']>;
  indexOf?: Maybe<Scalars['String']['output']>;
  mappedReadLength?: Maybe<Scalars['String']['output']>;
  outputType?: Maybe<Scalars['String']['output']>;
  pairedEnd?: Maybe<Scalars['String']['output']>;
  pairedWith?: Maybe<Scalars['String']['output']>;
  readLength?: Maybe<Scalars['String']['output']>;
  runType?: Maybe<Scalars['String']['output']>;
  s3Uri?: Maybe<Scalars['String']['output']>;
  technicalReplicates?: Maybe<Scalars['String']['output']>;
};

export type EnrichedFileInput = {
  encode?: InputMaybe<Array<EnrichedEncodeFileInput>>;
  fourdn?: InputMaybe<Array<EnrichedFourdnFileInput>>;
  hubmap?: InputMaybe<Array<EnrichedHubmapFileInput>>;
};

export type EnrichedFileType = {
  __typename?: 'EnrichedFileType';
  encode?: Maybe<EnrichedEncodeFileType>;
  fourdn?: Maybe<EnrichedFourdnFileType>;
  hubmap?: Maybe<EnrichedHubmapFileType>;
};

export type EnrichedFourdnCollectionInput = {
  averageFragmentSize?: InputMaybe<Array<Scalars['String']['input']>>;
  biotinRemoved?: InputMaybe<Array<Scalars['String']['input']>>;
  crosslinkingMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  crosslinkingTemperature?: InputMaybe<Array<Scalars['String']['input']>>;
  crosslinkingTime?: InputMaybe<Array<Scalars['String']['input']>>;
  dateCreated?: InputMaybe<Array<Scalars['String']['input']>>;
  digestionEnzyme?: InputMaybe<Array<Scalars['String']['input']>>;
  digestionTemperature?: InputMaybe<Array<Scalars['String']['input']>>;
  digestionTime?: InputMaybe<Array<Scalars['String']['input']>>;
  displayTitle?: InputMaybe<Array<Scalars['String']['input']>>;
  fragmentSizeRange?: InputMaybe<Array<Scalars['String']['input']>>;
  fragmentationMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  libraryPrepKit?: InputMaybe<Array<Scalars['String']['input']>>;
  ligationTemperature?: InputMaybe<Array<Scalars['String']['input']>>;
  ligationTime?: InputMaybe<Array<Scalars['String']['input']>>;
  ligationVolume?: InputMaybe<Array<Scalars['String']['input']>>;
  status?: InputMaybe<Array<Scalars['String']['input']>>;
  taggingMethod?: InputMaybe<Array<Scalars['String']['input']>>;
  targetedFactor?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedFourdnCollectionType = {
  __typename?: 'EnrichedFourdnCollectionType';
  averageFragmentSize?: Maybe<Scalars['String']['output']>;
  biotinRemoved?: Maybe<Scalars['String']['output']>;
  crosslinkingMethod?: Maybe<Scalars['String']['output']>;
  crosslinkingTemperature?: Maybe<Scalars['String']['output']>;
  crosslinkingTime?: Maybe<Scalars['String']['output']>;
  dateCreated?: Maybe<Scalars['String']['output']>;
  digestionEnzyme?: Maybe<Scalars['String']['output']>;
  digestionTemperature?: Maybe<Scalars['String']['output']>;
  digestionTime?: Maybe<Scalars['String']['output']>;
  displayTitle?: Maybe<Scalars['String']['output']>;
  fragmentSizeRange?: Maybe<Scalars['String']['output']>;
  fragmentationMethod?: Maybe<Scalars['String']['output']>;
  libraryPrepKit?: Maybe<Scalars['String']['output']>;
  ligationTemperature?: Maybe<Scalars['String']['output']>;
  ligationTime?: Maybe<Scalars['String']['output']>;
  ligationVolume?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  taggingMethod?: Maybe<Scalars['String']['output']>;
  targetedFactor?: Maybe<Array<Scalars['String']['output']>>;
};

export type EnrichedFourdnFileInput = {
  biosourceName?: InputMaybe<Array<Scalars['String']['input']>>;
  cellLineTier?: InputMaybe<Array<Scalars['String']['input']>>;
  condition?: InputMaybe<Array<Scalars['String']['input']>>;
  dataset?: InputMaybe<Array<Scalars['String']['input']>>;
  enrichedFileFormat?: InputMaybe<Array<Scalars['String']['input']>>;
  fileType?: InputMaybe<Array<Scalars['String']['input']>>;
  fileTypeDetailed?: InputMaybe<Array<Scalars['String']['input']>>;
  genomeAssembly?: InputMaybe<Array<Scalars['String']['input']>>;
  replicateInfo?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedFourdnFileType = {
  __typename?: 'EnrichedFourdnFileType';
  biosourceName?: Maybe<Scalars['String']['output']>;
  cellLineTier?: Maybe<Scalars['String']['output']>;
  condition?: Maybe<Scalars['String']['output']>;
  dataset?: Maybe<Scalars['String']['output']>;
  enrichedFileFormat?: Maybe<Scalars['String']['output']>;
  extraFiles?: Maybe<Array<ExtraFileType>>;
  fileType?: Maybe<Scalars['String']['output']>;
  fileTypeDetailed?: Maybe<Scalars['String']['output']>;
  genomeAssembly?: Maybe<Scalars['String']['output']>;
  replicateInfo?: Maybe<Scalars['String']['output']>;
};

export type EnrichedHubmapCollectionInput = {
  analyteClass?: InputMaybe<Array<Scalars['String']['input']>>;
  datasetType?: InputMaybe<Array<Scalars['String']['input']>>;
  groupName?: InputMaybe<Array<Scalars['String']['input']>>;
  pipeline?: InputMaybe<Array<Scalars['String']['input']>>;
  processing?: InputMaybe<Array<Scalars['String']['input']>>;
  visualization?: InputMaybe<Array<Scalars['Boolean']['input']>>;
};

export type EnrichedHubmapCollectionType = {
  __typename?: 'EnrichedHubmapCollectionType';
  groupName?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  pipeline?: Maybe<Scalars['String']['output']>;
  processing?: Maybe<Scalars['String']['output']>;
  visualization?: Maybe<Scalars['Boolean']['output']>;
  vitessceHints?: Maybe<Array<Scalars['String']['output']>>;
};

export type EnrichedHubmapFileInput = {
  genomeAssembly?: InputMaybe<Array<Scalars['String']['input']>>;
  isDataProduct?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  relPath?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type EnrichedHubmapFileType = {
  __typename?: 'EnrichedHubmapFileType';
  genomeAssembly?: Maybe<Scalars['String']['output']>;
  isDataProduct?: Maybe<Scalars['Boolean']['output']>;
  relPath?: Maybe<Scalars['String']['output']>;
};

export type EnrichedHubmapSubjectType = {
  __typename?: 'EnrichedHubmapSubjectType';
  ageUnit?: Maybe<Scalars['String']['output']>;
  ageValue?: Maybe<Scalars['Float']['output']>;
  bodyMassIndexUnit?: Maybe<Scalars['String']['output']>;
  bodyMassIndexValue?: Maybe<Scalars['Float']['output']>;
  causeOfDeath?: Maybe<Scalars['String']['output']>;
  deathEvent?: Maybe<Scalars['String']['output']>;
  heightUnit?: Maybe<Scalars['String']['output']>;
  heightValue?: Maybe<Scalars['Float']['output']>;
  mechanismOfInjury?: Maybe<Scalars['String']['output']>;
  medicalHistory?: Maybe<Array<Scalars['String']['output']>>;
  race?: Maybe<Scalars['String']['output']>;
  sex?: Maybe<Scalars['String']['output']>;
  socialHistory?: Maybe<Array<Scalars['String']['output']>>;
  weightUnit?: Maybe<Scalars['String']['output']>;
  weightValue?: Maybe<Scalars['Float']['output']>;
};

export type EnrichedSubjectType = {
  __typename?: 'EnrichedSubjectType';
  hubmap?: Maybe<EnrichedHubmapSubjectType>;
};

export type ExtraFileType = {
  __typename?: 'ExtraFileType';
  fileFormat?: Maybe<Scalars['String']['output']>;
  fileSize?: Maybe<Scalars['Int']['output']>;
  href?: Maybe<Scalars['String']['output']>;
  md5sum?: Maybe<Scalars['String']['output']>;
};

export type FileFormatInput = {
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type FileFormatType = {
  __typename?: 'FileFormatType';
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type FileMetadataInput = {
  accessUrl?: InputMaybe<Array<Scalars['String']['input']>>;
  analysisType?: InputMaybe<Array<Scalars['String']['input']>>;
  assayInfo?: InputMaybe<Array<Scalars['String']['input']>>;
  assayType?: InputMaybe<Array<AssayTypeInput>>;
  biologicalReplicates?: InputMaybe<Array<Scalars['String']['input']>>;
  bundleCollectionIdNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  bundleCollectionLocalId?: InputMaybe<Array<Scalars['String']['input']>>;
  collections?: InputMaybe<Array<CollectionInput>>;
  compressionFormat?: InputMaybe<Array<Scalars['String']['input']>>;
  condition?: InputMaybe<Array<Scalars['String']['input']>>;
  creationTime?: InputMaybe<Array<Scalars['String']['input']>>;
  dataAccessLevel?: InputMaybe<Array<Scalars['String']['input']>>;
  dataType?: InputMaybe<Array<DataTypeInput>>;
  dbgapStudyId?: InputMaybe<Array<Scalars['String']['input']>>;
  dcc?: InputMaybe<Array<DccInput>>;
  extra?: InputMaybe<Array<EnrichedFileInput>>;
  fileFormat?: InputMaybe<Array<FileFormatInput>>;
  filename?: InputMaybe<Array<Scalars['String']['input']>>;
  genomeAnnotation?: InputMaybe<Array<Scalars['String']['input']>>;
  genomeAssembly?: InputMaybe<Array<Scalars['String']['input']>>;
  idNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  localId?: InputMaybe<Array<Scalars['String']['input']>>;
  md5?: InputMaybe<Array<Scalars['String']['input']>>;
  mimeType?: InputMaybe<Array<Scalars['String']['input']>>;
  outputType?: InputMaybe<Array<Scalars['String']['input']>>;
  outputTypeDetail?: InputMaybe<Array<Scalars['String']['input']>>;
  persistentId?: InputMaybe<Array<Scalars['String']['input']>>;
  project?: InputMaybe<Array<ProjectInput>>;
  projectIdNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  projectLocalId?: InputMaybe<Array<Scalars['String']['input']>>;
  sha256?: InputMaybe<Array<Scalars['String']['input']>>;
  sizeInBytes?: InputMaybe<Array<Scalars['Int']['input']>>;
  technicalReplicates?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type FileMetadataType = {
  __typename?: 'FileMetadataType';
  accessUrl?: Maybe<Scalars['String']['output']>;
  analysisType?: Maybe<Scalars['String']['output']>;
  assayInfo?: Maybe<Scalars['String']['output']>;
  assayType?: Maybe<AssayTypeType>;
  biologicalReplicates?: Maybe<Scalars['String']['output']>;
  bundleCollectionIdNamespace?: Maybe<Scalars['String']['output']>;
  bundleCollectionLocalId?: Maybe<Scalars['String']['output']>;
  collections: Array<CollectionType>;
  compressionFormat?: Maybe<Scalars['String']['output']>;
  condition?: Maybe<Scalars['String']['output']>;
  creationTime?: Maybe<Scalars['String']['output']>;
  dataAccessLevel?: Maybe<Scalars['String']['output']>;
  dataType?: Maybe<DataTypeType>;
  dbgapStudyId?: Maybe<Scalars['String']['output']>;
  dcc: DccType;
  extra?: Maybe<EnrichedFileType>;
  fileFormat?: Maybe<FileFormatType>;
  filename: Scalars['String']['output'];
  genomeAnnotation?: Maybe<Scalars['String']['output']>;
  genomeAssembly?: Maybe<Scalars['String']['output']>;
  idNamespace: Scalars['String']['output'];
  localId: Scalars['String']['output'];
  md5?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  outputType?: Maybe<Scalars['String']['output']>;
  outputTypeDetail?: Maybe<Scalars['String']['output']>;
  persistentId?: Maybe<Scalars['String']['output']>;
  project?: Maybe<ProjectType>;
  projectIdNamespace: Scalars['String']['output'];
  projectLocalId: Scalars['String']['output'];
  sha256?: Maybe<Scalars['String']['output']>;
  sizeInBytes?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  technicalReplicates?: Maybe<Scalars['String']['output']>;
};

export type NcbiTaxonomyInput = {
  clade?: InputMaybe<Array<Scalars['String']['input']>>;
  id?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type NcbiTaxonomyType = {
  __typename?: 'NcbiTaxonomyType';
  clade?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type ProjectInput = {
  abbreviation?: InputMaybe<Array<Scalars['String']['input']>>;
  description?: InputMaybe<Array<Scalars['String']['input']>>;
  idNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  localId?: InputMaybe<Array<Scalars['String']['input']>>;
  name?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ProjectType = {
  __typename?: 'ProjectType';
  abbreviation?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  idNamespace: Scalars['String']['output'];
  localId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  persistentId?: Maybe<Scalars['String']['output']>;
};

export type Query = {
  __typename?: 'Query';
  distinctValues: Array<DistinctFieldType>;
  file?: Maybe<FileMetadataType>;
  files: Array<FileMetadataType>;
};


export type QueryDistinctValuesArgs = {
  fields: Array<Scalars['String']['input']>;
  input?: InputMaybe<Array<FileMetadataInput>>;
};


export type QueryFileArgs = {
  id: Scalars['ObjectIdScalar']['input'];
};


export type QueryFilesArgs = {
  input?: InputMaybe<Array<FileMetadataInput>>;
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
};

export type SubjectInput = {
  ageAtEnrollment?: InputMaybe<Array<Scalars['Float']['input']>>;
  ageAtSampling?: InputMaybe<Array<Scalars['Float']['input']>>;
  creationTime?: InputMaybe<Array<Scalars['String']['input']>>;
  ethnicity?: InputMaybe<Array<Scalars['String']['input']>>;
  granularity?: InputMaybe<Array<Scalars['String']['input']>>;
  idNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  localId?: InputMaybe<Array<Scalars['String']['input']>>;
  persistentId?: InputMaybe<Array<Scalars['String']['input']>>;
  projectIdNamespace?: InputMaybe<Array<Scalars['String']['input']>>;
  projectLocalId?: InputMaybe<Array<Scalars['String']['input']>>;
  race?: InputMaybe<Array<Scalars['String']['input']>>;
  sex?: InputMaybe<Array<Scalars['String']['input']>>;
  taxonomy?: InputMaybe<Array<NcbiTaxonomyInput>>;
};

export type SubjectType = {
  __typename?: 'SubjectType';
  ageAtEnrollment?: Maybe<Scalars['Float']['output']>;
  ageAtSampling?: Maybe<Scalars['Float']['output']>;
  creationTime?: Maybe<Scalars['String']['output']>;
  ethnicity?: Maybe<Scalars['String']['output']>;
  extra?: Maybe<EnrichedSubjectType>;
  granularity?: Maybe<Scalars['String']['output']>;
  idNamespace: Scalars['String']['output'];
  localId: Scalars['String']['output'];
  persistentId?: Maybe<Scalars['String']['output']>;
  projectIdNamespace: Scalars['String']['output'];
  projectLocalId: Scalars['String']['output'];
  race: Array<Scalars['String']['output']>;
  sex?: Maybe<Scalars['String']['output']>;
  taxonomy?: Maybe<NcbiTaxonomyType>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = Record<PropertyKey, never>, TParent = Record<PropertyKey, never>, TContext = Record<PropertyKey, never>, TArgs = Record<PropertyKey, never>> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;





/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AnatomyInput: AnatomyInput;
  AnatomyType: ResolverTypeWrapper<AnatomyType>;
  AssayTypeInput: AssayTypeInput;
  AssayTypeType: ResolverTypeWrapper<AssayTypeType>;
  BiosampleInput: BiosampleInput;
  BiosampleType: ResolverTypeWrapper<BiosampleType>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CollectionInput: CollectionInput;
  CollectionType: ResolverTypeWrapper<CollectionType>;
  DataTypeInput: DataTypeInput;
  DataTypeType: ResolverTypeWrapper<DataTypeType>;
  DccInput: DccInput;
  DccType: ResolverTypeWrapper<DccType>;
  DistinctFieldType: ResolverTypeWrapper<DistinctFieldType>;
  EnrichedBiosampleInput: EnrichedBiosampleInput;
  EnrichedBiosampleType: ResolverTypeWrapper<EnrichedBiosampleType>;
  EnrichedCollectionInput: EnrichedCollectionInput;
  EnrichedCollectionType: ResolverTypeWrapper<EnrichedCollectionType>;
  EnrichedEncodeBiosampleInput: EnrichedEncodeBiosampleInput;
  EnrichedEncodeBiosampleType: ResolverTypeWrapper<EnrichedEncodeBiosampleType>;
  EnrichedEncodeCollectionInput: EnrichedEncodeCollectionInput;
  EnrichedEncodeCollectionType: ResolverTypeWrapper<EnrichedEncodeCollectionType>;
  EnrichedEncodeFileInput: EnrichedEncodeFileInput;
  EnrichedEncodeFileType: ResolverTypeWrapper<EnrichedEncodeFileType>;
  EnrichedFileInput: EnrichedFileInput;
  EnrichedFileType: ResolverTypeWrapper<EnrichedFileType>;
  EnrichedFourdnCollectionInput: EnrichedFourdnCollectionInput;
  EnrichedFourdnCollectionType: ResolverTypeWrapper<EnrichedFourdnCollectionType>;
  EnrichedFourdnFileInput: EnrichedFourdnFileInput;
  EnrichedFourdnFileType: ResolverTypeWrapper<EnrichedFourdnFileType>;
  EnrichedHubmapCollectionInput: EnrichedHubmapCollectionInput;
  EnrichedHubmapCollectionType: ResolverTypeWrapper<EnrichedHubmapCollectionType>;
  EnrichedHubmapFileInput: EnrichedHubmapFileInput;
  EnrichedHubmapFileType: ResolverTypeWrapper<EnrichedHubmapFileType>;
  EnrichedHubmapSubjectType: ResolverTypeWrapper<EnrichedHubmapSubjectType>;
  EnrichedSubjectType: ResolverTypeWrapper<EnrichedSubjectType>;
  ExtraFileType: ResolverTypeWrapper<ExtraFileType>;
  FileFormatInput: FileFormatInput;
  FileFormatType: ResolverTypeWrapper<FileFormatType>;
  FileMetadataInput: FileMetadataInput;
  FileMetadataType: ResolverTypeWrapper<FileMetadataType>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  NcbiTaxonomyInput: NcbiTaxonomyInput;
  NcbiTaxonomyType: ResolverTypeWrapper<NcbiTaxonomyType>;
  ObjectIdScalar: ResolverTypeWrapper<Scalars['ObjectIdScalar']['output']>;
  ProjectInput: ProjectInput;
  ProjectType: ResolverTypeWrapper<ProjectType>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  SubjectInput: SubjectInput;
  SubjectType: ResolverTypeWrapper<SubjectType>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AnatomyInput: AnatomyInput;
  AnatomyType: AnatomyType;
  AssayTypeInput: AssayTypeInput;
  AssayTypeType: AssayTypeType;
  BiosampleInput: BiosampleInput;
  BiosampleType: BiosampleType;
  Boolean: Scalars['Boolean']['output'];
  CollectionInput: CollectionInput;
  CollectionType: CollectionType;
  DataTypeInput: DataTypeInput;
  DataTypeType: DataTypeType;
  DccInput: DccInput;
  DccType: DccType;
  DistinctFieldType: DistinctFieldType;
  EnrichedBiosampleInput: EnrichedBiosampleInput;
  EnrichedBiosampleType: EnrichedBiosampleType;
  EnrichedCollectionInput: EnrichedCollectionInput;
  EnrichedCollectionType: EnrichedCollectionType;
  EnrichedEncodeBiosampleInput: EnrichedEncodeBiosampleInput;
  EnrichedEncodeBiosampleType: EnrichedEncodeBiosampleType;
  EnrichedEncodeCollectionInput: EnrichedEncodeCollectionInput;
  EnrichedEncodeCollectionType: EnrichedEncodeCollectionType;
  EnrichedEncodeFileInput: EnrichedEncodeFileInput;
  EnrichedEncodeFileType: EnrichedEncodeFileType;
  EnrichedFileInput: EnrichedFileInput;
  EnrichedFileType: EnrichedFileType;
  EnrichedFourdnCollectionInput: EnrichedFourdnCollectionInput;
  EnrichedFourdnCollectionType: EnrichedFourdnCollectionType;
  EnrichedFourdnFileInput: EnrichedFourdnFileInput;
  EnrichedFourdnFileType: EnrichedFourdnFileType;
  EnrichedHubmapCollectionInput: EnrichedHubmapCollectionInput;
  EnrichedHubmapCollectionType: EnrichedHubmapCollectionType;
  EnrichedHubmapFileInput: EnrichedHubmapFileInput;
  EnrichedHubmapFileType: EnrichedHubmapFileType;
  EnrichedHubmapSubjectType: EnrichedHubmapSubjectType;
  EnrichedSubjectType: EnrichedSubjectType;
  ExtraFileType: ExtraFileType;
  FileFormatInput: FileFormatInput;
  FileFormatType: FileFormatType;
  FileMetadataInput: FileMetadataInput;
  FileMetadataType: FileMetadataType;
  Float: Scalars['Float']['output'];
  Int: Scalars['Int']['output'];
  JSON: Scalars['JSON']['output'];
  NcbiTaxonomyInput: NcbiTaxonomyInput;
  NcbiTaxonomyType: NcbiTaxonomyType;
  ObjectIdScalar: Scalars['ObjectIdScalar']['output'];
  ProjectInput: ProjectInput;
  ProjectType: ProjectType;
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
  SubjectInput: SubjectInput;
  SubjectType: SubjectType;
};

export type AnatomyTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AnatomyType'] = ResolversParentTypes['AnatomyType']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type AssayTypeTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AssayTypeType'] = ResolversParentTypes['AssayTypeType']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type BiosampleTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['BiosampleType'] = ResolversParentTypes['BiosampleType']> = {
  anatomy?: Resolver<Maybe<ResolversTypes['AnatomyType']>, ParentType, ContextType>;
  biofluid?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extra?: Resolver<Maybe<ResolversTypes['EnrichedBiosampleType']>, ParentType, ContextType>;
  idNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  persistentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  projectIdNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectLocalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  samplePrepMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subjects?: Resolver<Array<ResolversTypes['SubjectType']>, ParentType, ContextType>;
};

export type CollectionTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['CollectionType'] = ResolversParentTypes['CollectionType']> = {
  abbreviation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  analyteClass?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  anatomy?: Resolver<Array<ResolversTypes['AnatomyType']>, ParentType, ContextType>;
  biosamples?: Resolver<Array<ResolversTypes['BiosampleType']>, ParentType, ContextType>;
  creationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  experimentTarget?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  experimentType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extra?: Resolver<Maybe<ResolversTypes['EnrichedCollectionType']>, ParentType, ContextType>;
  idNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lab?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  localId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  persistentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subjects?: Resolver<Array<ResolversTypes['SubjectType']>, ParentType, ContextType>;
};

export type DataTypeTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['DataTypeType'] = ResolversParentTypes['DataTypeType']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DccTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['DccType'] = ResolversParentTypes['DccType']> = {
  contactEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  contactName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dccAbbreviation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dccDescription?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dccName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  dccUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectIdNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectLocalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type DistinctFieldTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['DistinctFieldType'] = ResolversParentTypes['DistinctFieldType']> = {
  field?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
};

export type EnrichedBiosampleTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedBiosampleType'] = ResolversParentTypes['EnrichedBiosampleType']> = {
  encode?: Resolver<Maybe<ResolversTypes['EnrichedEncodeBiosampleType']>, ParentType, ContextType>;
};

export type EnrichedCollectionTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedCollectionType'] = ResolversParentTypes['EnrichedCollectionType']> = {
  encode?: Resolver<Maybe<ResolversTypes['EnrichedEncodeCollectionType']>, ParentType, ContextType>;
  fourdn?: Resolver<Maybe<ResolversTypes['EnrichedFourdnCollectionType']>, ParentType, ContextType>;
  hubmap?: Resolver<Maybe<ResolversTypes['EnrichedHubmapCollectionType']>, ParentType, ContextType>;
};

export type EnrichedEncodeBiosampleTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedEncodeBiosampleType'] = ResolversParentTypes['EnrichedEncodeBiosampleType']> = {
  biosampleGeneticModifications?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biosampleTreatments?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biosampleTreatmentsAmount?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biosampleTreatmentsDuration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biosampleType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryCrosslinkingMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryDepletedIn?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryExtractionMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryFragmentationMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryLysisMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryMadeFrom?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  librarySizeRange?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryStrandSpecific?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EnrichedEncodeCollectionTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedEncodeCollectionType'] = ResolversParentTypes['EnrichedEncodeCollectionType']> = {
  dbxrefs?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  platform?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rbnsProteinConcentration?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EnrichedEncodeFileTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedEncodeFileType'] = ResolversParentTypes['EnrichedEncodeFileType']> = {
  assembly?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  auditError?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  auditNotCompliant?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  auditWarning?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  azureUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biologicalReplicates?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  controlledBy?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  derivedFrom?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileAnalysisStatus?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileAnalysisTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileFormatType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  genomeAnnotation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  indexOf?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mappedReadLength?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  outputType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pairedEnd?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  pairedWith?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  readLength?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  runType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  s3Uri?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  technicalReplicates?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EnrichedFileTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedFileType'] = ResolversParentTypes['EnrichedFileType']> = {
  encode?: Resolver<Maybe<ResolversTypes['EnrichedEncodeFileType']>, ParentType, ContextType>;
  fourdn?: Resolver<Maybe<ResolversTypes['EnrichedFourdnFileType']>, ParentType, ContextType>;
  hubmap?: Resolver<Maybe<ResolversTypes['EnrichedHubmapFileType']>, ParentType, ContextType>;
};

export type EnrichedFourdnCollectionTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedFourdnCollectionType'] = ResolversParentTypes['EnrichedFourdnCollectionType']> = {
  averageFragmentSize?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  biotinRemoved?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  crosslinkingMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  crosslinkingTemperature?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  crosslinkingTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dateCreated?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  digestionEnzyme?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  digestionTemperature?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  digestionTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  displayTitle?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fragmentSizeRange?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fragmentationMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  libraryPrepKit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ligationTemperature?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ligationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ligationVolume?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  taggingMethod?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  targetedFactor?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
};

export type EnrichedFourdnFileTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedFourdnFileType'] = ResolversParentTypes['EnrichedFourdnFileType']> = {
  biosourceName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  cellLineTier?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  condition?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dataset?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  enrichedFileFormat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extraFiles?: Resolver<Maybe<Array<ResolversTypes['ExtraFileType']>>, ParentType, ContextType>;
  fileType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileTypeDetailed?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  genomeAssembly?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  replicateInfo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EnrichedHubmapCollectionTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedHubmapCollectionType'] = ResolversParentTypes['EnrichedHubmapCollectionType']> = {
  groupName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  metadata?: Resolver<Maybe<ResolversTypes['JSON']>, ParentType, ContextType>;
  pipeline?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  processing?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  visualization?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  vitessceHints?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
};

export type EnrichedHubmapFileTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedHubmapFileType'] = ResolversParentTypes['EnrichedHubmapFileType']> = {
  genomeAssembly?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isDataProduct?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  relPath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type EnrichedHubmapSubjectTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedHubmapSubjectType'] = ResolversParentTypes['EnrichedHubmapSubjectType']> = {
  ageUnit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ageValue?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  bodyMassIndexUnit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bodyMassIndexValue?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  causeOfDeath?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  deathEvent?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  heightUnit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  heightValue?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  mechanismOfInjury?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  medicalHistory?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  race?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sex?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  socialHistory?: Resolver<Maybe<Array<ResolversTypes['String']>>, ParentType, ContextType>;
  weightUnit?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  weightValue?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
};

export type EnrichedSubjectTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EnrichedSubjectType'] = ResolversParentTypes['EnrichedSubjectType']> = {
  hubmap?: Resolver<Maybe<ResolversTypes['EnrichedHubmapSubjectType']>, ParentType, ContextType>;
};

export type ExtraFileTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExtraFileType'] = ResolversParentTypes['ExtraFileType']> = {
  fileFormat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  fileSize?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  href?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  md5sum?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type FileFormatTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['FileFormatType'] = ResolversParentTypes['FileFormatType']> = {
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type FileMetadataTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['FileMetadataType'] = ResolversParentTypes['FileMetadataType']> = {
  accessUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  analysisType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  assayInfo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  assayType?: Resolver<Maybe<ResolversTypes['AssayTypeType']>, ParentType, ContextType>;
  biologicalReplicates?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundleCollectionIdNamespace?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  bundleCollectionLocalId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  collections?: Resolver<Array<ResolversTypes['CollectionType']>, ParentType, ContextType>;
  compressionFormat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  condition?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dataAccessLevel?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dataType?: Resolver<Maybe<ResolversTypes['DataTypeType']>, ParentType, ContextType>;
  dbgapStudyId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dcc?: Resolver<ResolversTypes['DccType'], ParentType, ContextType>;
  extra?: Resolver<Maybe<ResolversTypes['EnrichedFileType']>, ParentType, ContextType>;
  fileFormat?: Resolver<Maybe<ResolversTypes['FileFormatType']>, ParentType, ContextType>;
  filename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  genomeAnnotation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  genomeAssembly?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  md5?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  mimeType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  outputType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  outputTypeDetail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  persistentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  project?: Resolver<Maybe<ResolversTypes['ProjectType']>, ParentType, ContextType>;
  projectIdNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectLocalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sha256?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sizeInBytes?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  status?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  technicalReplicates?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type NcbiTaxonomyTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['NcbiTaxonomyType'] = ResolversParentTypes['NcbiTaxonomyType']> = {
  clade?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export interface ObjectIdScalarScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ObjectIdScalar'], any> {
  name: 'ObjectIdScalar';
}

export type ProjectTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['ProjectType'] = ResolversParentTypes['ProjectType']> = {
  abbreviation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  persistentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  distinctValues?: Resolver<Array<ResolversTypes['DistinctFieldType']>, ParentType, ContextType, RequireFields<QueryDistinctValuesArgs, 'fields' | 'input'>>;
  file?: Resolver<Maybe<ResolversTypes['FileMetadataType']>, ParentType, ContextType, RequireFields<QueryFileArgs, 'id'>>;
  files?: Resolver<Array<ResolversTypes['FileMetadataType']>, ParentType, ContextType, RequireFields<QueryFilesArgs, 'input' | 'page' | 'pageSize'>>;
};

export type SubjectTypeResolvers<ContextType = any, ParentType extends ResolversParentTypes['SubjectType'] = ResolversParentTypes['SubjectType']> = {
  ageAtEnrollment?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  ageAtSampling?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  creationTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  ethnicity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  extra?: Resolver<Maybe<ResolversTypes['EnrichedSubjectType']>, ParentType, ContextType>;
  granularity?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  idNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  localId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  persistentId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  projectIdNamespace?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  projectLocalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  race?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  sex?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  taxonomy?: Resolver<Maybe<ResolversTypes['NcbiTaxonomyType']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AnatomyType?: AnatomyTypeResolvers<ContextType>;
  AssayTypeType?: AssayTypeTypeResolvers<ContextType>;
  BiosampleType?: BiosampleTypeResolvers<ContextType>;
  CollectionType?: CollectionTypeResolvers<ContextType>;
  DataTypeType?: DataTypeTypeResolvers<ContextType>;
  DccType?: DccTypeResolvers<ContextType>;
  DistinctFieldType?: DistinctFieldTypeResolvers<ContextType>;
  EnrichedBiosampleType?: EnrichedBiosampleTypeResolvers<ContextType>;
  EnrichedCollectionType?: EnrichedCollectionTypeResolvers<ContextType>;
  EnrichedEncodeBiosampleType?: EnrichedEncodeBiosampleTypeResolvers<ContextType>;
  EnrichedEncodeCollectionType?: EnrichedEncodeCollectionTypeResolvers<ContextType>;
  EnrichedEncodeFileType?: EnrichedEncodeFileTypeResolvers<ContextType>;
  EnrichedFileType?: EnrichedFileTypeResolvers<ContextType>;
  EnrichedFourdnCollectionType?: EnrichedFourdnCollectionTypeResolvers<ContextType>;
  EnrichedFourdnFileType?: EnrichedFourdnFileTypeResolvers<ContextType>;
  EnrichedHubmapCollectionType?: EnrichedHubmapCollectionTypeResolvers<ContextType>;
  EnrichedHubmapFileType?: EnrichedHubmapFileTypeResolvers<ContextType>;
  EnrichedHubmapSubjectType?: EnrichedHubmapSubjectTypeResolvers<ContextType>;
  EnrichedSubjectType?: EnrichedSubjectTypeResolvers<ContextType>;
  ExtraFileType?: ExtraFileTypeResolvers<ContextType>;
  FileFormatType?: FileFormatTypeResolvers<ContextType>;
  FileMetadataType?: FileMetadataTypeResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  NcbiTaxonomyType?: NcbiTaxonomyTypeResolvers<ContextType>;
  ObjectIdScalar?: GraphQLScalarType;
  ProjectType?: ProjectTypeResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SubjectType?: SubjectTypeResolvers<ContextType>;
};

