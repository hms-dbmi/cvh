"""Rename Vitessce file_type values to match vitessce.js's canonical
`FileType` constants.

Before: `ome-tiff`, `ome-zarr`.
After:  `image.ome-tiff`, `image.ome-zarr`.

The other two Vitessce file_types on the branch (`anndata.zarr`,
`spatialdata.zarr`) already matched and are untouched.

Only rows created since the vitessce-updates work landed can have the
old values; the field is a free-form CharField so `field_type` isn't
constrained at the DB layer — we just walk the rows and rewrite.
"""

from django.db import migrations


VITESSCE_FILE_TYPE_RENAMES = {
    "ome-tiff": "image.ome-tiff",
    "ome-zarr": "image.ome-zarr",
}


def forward(apps, schema_editor):
    Dataset = apps.get_model("api", "Dataset")
    for old, new in VITESSCE_FILE_TYPE_RENAMES.items():
        Dataset.objects.filter(tool="vitessce", file_type=old).update(file_type=new)


def reverse(apps, schema_editor):
    Dataset = apps.get_model("api", "Dataset")
    # Same map, inverted.
    for old, new in VITESSCE_FILE_TYPE_RENAMES.items():
        Dataset.objects.filter(tool="vitessce", file_type=new).update(file_type=old)


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0032_dataset_tool"),
    ]

    operations = [
        migrations.RunPython(forward, reverse),
    ]
