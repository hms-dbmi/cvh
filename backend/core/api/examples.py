two_basic_views = {
    "responsiveSize": {"width": False, "height": False},
    "spacing": 100,
    "views": [
        {
            "id": "view-1",
            "layout": "linear",
            "tracks": [
                {
                    "id": "track-1",
                    "data": {
                        "url": "https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig",
                        "type": "bigwig",
                        "binSize": 8,
                    },
                    "mark": "bar",
                    "x": {"field": "start", "type": "genomic"},
                    "xe": {"field": "end", "type": "genomic"},
                    "y": {"field": "value", "type": "quantitative", "grid": True},
                    "width": 600,
                    "height": 100,
                }
            ],
        },
        {
            "id": "view-2",
            "layout": "circular",
            "xDomain": {"chromosome": "chr1"},
            "tracks": [
                {
                    "id": "track-4",
                    "data": {
                        "url": "https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig",
                        "type": "bigwig",
                        "binSize": 8,
                    },
                    "mark": "bar",
                    "x": {"field": "start", "type": "genomic"},
                    "xe": {"field": "end", "type": "genomic"},
                    "y": {"field": "value", "type": "quantitative", "grid": True},
                    "width": 600,
                    "height": 100,
                },
                {
                    "id": "track-5",
                    "data": {
                        "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
                        "type": "multivec",
                        "categories": [
                            "GSM2048305",
                            "GSM1375210",
                            "GSM2048292",
                            "GSM2048310",
                        ],
                        "binSize": 4,
                    },
                    "mark": "line",
                    "x": {"field": "position", "type": "genomic"},
                    "y": {"field": "value", "type": "quantitative", "grid": True},
                    "color": {"field": "category", "type": "nominal"},
                    "width": 600,
                    "height": 100,
                },
                {
                    "id": "track-6",
                    "data": {
                        "type": "csv",
                        "url": "https://somatic-browser-test.s3.amazonaws.com/SRR7890905/SRR7890905.gripss.filtered.bedpe",
                        "genomicFieldsToConvert": [
                            {
                                "chromosomeField": "chrom1",
                                "genomicFields": ["start1", "end1"],
                            },
                            {
                                "chromosomeField": "chrom2",
                                "genomicFields": ["start2", "end2"],
                            },
                        ],
                        "separator": "\t",
                    },
                    "mark": "withinLink",
                    "x": {"field": "start1", "type": "genomic"},
                    "xe": {"field": "end2", "type": "genomic"},
                    "opacity": {"value": 0.5},
                    "style": {"linkStyle": "circular", "linkMinHeight": 0.7},
                    "width": 600,
                    "height": 100,
                },
            ],
        },
    ],
}

hic_3d = {
    "id": "a874f802-f1a6-458b-807a-d7399c306add",
    "views": [
        {
            "id": "d5f3303b-0b00-4943-b6a5-139a437f97da",
            "views": [
                {
                    "id": "VIEW 1",
                    "style": {
                        "outline": "#C7C7C7",
                        "outlineWidth": 1,
                        "enableSmoothPath": True,
                    },
                    "layout": {
                        "type": "spatial",
                        "model": {
                            "url": "https://pub-5c3f8ce35c924114a178c6e929fc3ac7.r2.dev/Tan-2018_GSM3271347_gm12878_01.csv",
                            "xyz": ["x", "y", "z"],
                            "type": "csv",
                            "position": "coord",
                            "chromosome": "chr",
                        },
                    },
                    "tracks": [
                        {
                            "style": {
                                "outline": "transparent",
                                "background": "transparent",
                            },
                            "id": "dummy-track-VIEW 1-0",
                            "type": "dummy-track",
                            "height": 6,
                            "width": 6,
                        },
                        {
                            "style": {
                                "outline": "#C7C7C7",
                                "outlineWidth": 1,
                                "enableSmoothPath": True,
                            },
                            "x": {"type": "genomic", "field": "coord"},
                            "id": "d97f6c7f-9086-46c5-a4ac-051bc186bfa9",
                            "data": {
                                "url": "https://pub-5c3f8ce35c924114a178c6e929fc3ac7.r2.dev/Tan-2018_GSM3271347_gm12878_01.csv",
                                "type": "csv",
                                "separator": ",",
                                "genomicFieldsToConvert": [
                                    {
                                        "genomicFields": ["coord"],
                                        "chromosomeField": "chr",
                                    }
                                ],
                            },
                            "mark": "sphere",
                            "color": {"type": "nominal", "field": "chr"},
                            "width": 450,
                            "height": 450,
                            "stroke": {"value": "white"},
                            "opacity": {"value": 0.8},
                            "spacing": 0.1,
                            "strokeWidth": {"value": 1},
                        },
                        {
                            "style": {
                                "outline": "transparent",
                                "background": "transparent",
                            },
                            "id": "dummy-track-VIEW 1-last",
                            "type": "dummy-track",
                            "height": 6,
                            "width": 6,
                        },
                    ],
                }
            ],
            "spacing": 90,
            "arrangement": "vertical",
        },
        {
            "id": "6d7b08b0-e4f3-46f8-9b33-ee0cfa389d5c",
            "views": [
                {
                    "id": "VIEW 2",
                    "style": {
                        "outline": "#C7C7C7",
                        "outlineWidth": 1,
                        "enableSmoothPath": True,
                    },
                    "tracks": [
                        {
                            "style": {
                                "outline": "transparent",
                                "background": "transparent",
                            },
                            "id": "dummy-track-VIEW 2-0",
                            "type": "dummy-track",
                            "height": 6,
                            "width": 6,
                        },
                        {
                            "style": {
                                "outline": "#C7C7C7",
                                "outlineWidth": 1,
                                "enableSmoothPath": True,
                            },
                            "x": {"type": "genomic", "field": "start"},
                            "y": {"axis": "left", "type": "genomic", "field": "start2"},
                            "id": "6d40c05e-13ca-427f-a347-50e3ae65fb98",
                            "xe": {"type": "genomic", "field": "end"},
                            "ye": {"type": "genomic", "field": "end2"},
                            "data": {
                                "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-hic-hg38",
                                "type": "matrix",
                            },
                            "mark": "rect",
                            "color": {
                                "type": "quantitative",
                                "field": "value",
                                "range": "hot",
                                "legend": False,
                            },
                            "title": "HFFc6 Hi-C",
                            "width": 450,
                            "height": 450,
                            "xDomain": {"interval": [200000000, 1500000000]},
                            "linkingId": "9b11160c-ee1c-4bc3-87c1-b0510722a7b0",
                        },
                        {
                            "style": {
                                "outline": "transparent",
                                "background": "transparent",
                            },
                            "id": "dummy-track-VIEW 2-last",
                            "type": "dummy-track",
                            "height": 6,
                            "width": 6,
                        },
                    ],
                }
            ],
            "spacing": 90,
            "arrangement": "vertical",
        },
    ],
    "spacing": 90,
    "arrangement": "horizontal",
}

EXAMPLE_DATASETS = {
    1: {
        "visualization": {
            "name": "Two Basic Views",
            "description": (
                "Two views in both linear and circular layouts."
                " Data: Schwarzer et al. (2017) (PMCID: PMC5687303)"
                " and Cistrome DB Zheng R. et al. (2019)."
            ),
            "conf": two_basic_views,
        },
        "data": [
            {
                "name": "HFFc6_H3K4me3.bigwig",
                "file_type": "bigwig",
                "data_type": "",
                "source_url": "https://s3.amazonaws.com/gosling-lang.org/data/HFFc6_H3K4me3.bigWig",
                "assembly": "hg38",
                "tags": [
                    {"key": "project", "tag": "Hi-C"},
                    {"key": "publication", "tag": "Schwarzer et al. 2017"},
                ],
            },
            {
                "name": "H3K27ac.multivec",
                "file_type": "multivec",
                "data_type": "",
                "source_url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
                "assembly": "hg38",
                "row_names": [
                    "GSM2048305",
                    "GSM1375210",
                    "GSM2048292",
                    "GSM2048310",
                ],
                "tags": [
                    {"key": "project", "tag": "Cistrome"},
                    {"key": "assay_type", "tag": "ChIP-seq & ATAC-seq"},
                    {"key": "publication", "tag": "L'Yi et al. 2023"},
                ],
            },
            {
                "name": "SRR7890905.gripss.filtered.bedpe",
                "file_type": "csv",
                "source_url": "https://somatic-browser-test.s3.amazonaws.com/SRR7890905/SRR7890905.gripss.filtered.bedpe",
                "separator": "\t",
                "headers": True,
                "data_column": [
                    ["chrom1", "chromosome"],
                    ["start1", "genomic"],
                    ["end1", "genomic"],
                    ["chrom2", "chromosome"],
                    ["start2", "genomic"],
                    ["end2", "genomic"],
                    ["sv_id", "key"],
                    ["pe_support", "quantitative"],
                    ["strand1", "nominal"],
                    ["strand2", "nominal"],
                    ["svclass", "nominal"],
                    ["svmethod", "nominal"],
                ],
                "assembly": "hg38",
                "tags": [
                    {"key": "project", "tag": "chromoscope"},
                    {"key": "sample", "tag": "SRR7890905_Hartwig"},
                    {"key": "data_type", "tag": "SV"},
                ],
            },
        ],
    },
    2: {
        "visualization": {
            "name": "3D + Hi-C",
            "description": (
                "Interactive visualization showing 3D genome structures"
                " of single diploid human cells (View 1) and a Hi-C"
                " matrix (View 2). Data: Tan et al. (2018) and"
                " Schwarzer et al. (2017)."
            ),
            "conf": hic_3d,
        },
        "data": [
            {
                "name": "Tan-2018_GSM3271347_gm12878_01.csv",
                "file_type": "csv",
                "data_type": "",
                "source_url": "https://pub-5c3f8ce35c924114a178c6e929fc3ac7.r2.dev/Tan-2018_GSM3271347_gm12878_01.csv",
                "headers": True,
                "separator": ",",
                "data_column": [
                    ["x", "quantitative"],
                    ["y", "quantitative"],
                    ["z", "quantitative"],
                    ["chr", "chromosome"],
                    ["coord", "genomic"],
                    ["patmat", "nominal"],
                ],
                "assembly": "hg38",
                "tags": [
                    {"key": "data_type", "tag": "spatial"},
                    {"key": "publication", "tag": "Tan et al. 2018"},
                ],
            },
            {
                "name": "hffc6-hic-hg38.cooler",
                "file_type": "cooler",
                "data_type": "",
                "source_url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=hffc6-hic-hg38",
                "assembly": "hg38",
                "tags": [
                    {"key": "project", "tag": "Hi-C"},
                    {"key": "assay_type", "tag": "Hi-C"},
                    {"key": "publication", "tag": "Schwarzer et al. 2017"},
                ],
            },
        ],
    },
}
