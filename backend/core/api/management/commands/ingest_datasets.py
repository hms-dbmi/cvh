from datetime import datetime
from django.conf import settings
from django.core.management.base import BaseCommand
import pyarrow.parquet as pq

from api.models import Project, Dataset


class Command(BaseCommand):
    help = "Create datasets from parquet file"

    def handle(self, *args, **kwargs):
        datafile = (
            settings.BASE_DIR
            / "data"
            / "metadata.consortia_ENCODE+4DN.biosamples_all.assays_CTCF+ATAC.parquet"
        )
        assert datafile.exists()

        file_data = pq.read_table(datafile).to_pylist()

        print(file_data[1])

        project = Project.objects.create(
            private=False,
            name="ENCODE + 4DN Biosamples",
            description="CTCF and ATAC data from Encode and 4DN",
        )
        datasets = [
            Dataset(**{
                "name": d["File Accession"] + "." + d["File Format"],
                "source_url": d["Portal URL"],
                "file_type": d["File Format"],
                "data_type": d["Assay"],
            },
            project_key=project)
            for d in file_data
        ]
        Dataset.objects.bulk_create(datasets)
