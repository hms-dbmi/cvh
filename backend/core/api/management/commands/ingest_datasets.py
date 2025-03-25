from datetime import datetime
from django.conf import settings
from django.core.management.base import BaseCommand
import pyarrow.parquet as pq
from environs import env
import boto3

from api.models import Project, Dataset, Tag, User, ProjectMember

fields = ["Biosource", "Biosource Type", "Target"]


def tag_datasets(datasets, table):
    for i, dataset in enumerate(datasets):
        table_record = table[i]
        for field in fields:
            v = table_record[field]
            if v and v != "None" and v != "None" and v != "null" and v != "Null":
                trimmed_value = v[:50]
                try:
                    tag = Tag.objects.get(tag=trimmed_value, key=field)
                except Tag.DoesNotExist:
                    tag = Tag.objects.create(tag=trimmed_value, key=field)
                dataset.tags.add(tag)


files = [
    "metadata.consortia_ENCODE+4DN.biosamples_all.assays_CTCF+ATAC.parquet",
    "metadata.consortia_ENCODE+4DN.biosamples_HCT116.assays_all.parquet",
]


class Command(BaseCommand):
    help = "Create datasets from parquet file"

    def add_arguments(self, parser):
        parser.add_argument("--email", type=str, help="Project creator email")

    def handle(self, *args, **kwargs):
        for file in files:
            datafile = settings.BASE_DIR / "data" / file

            s3 = boto3.client("s3")
            s3.download_file("cvh-seed-data", file, datafile)

            assert datafile.exists()

            email_arg = kwargs["email"]
            file_data = pq.read_table(datafile).to_pylist()

            creator = User.objects.get(email=email_arg)

            project = Project.objects.create(
                private=False,
                name="ENCODE + 4DN Biosamples",
                description="CTCF and ATAC data from Encode and 4DN",
                user_key=creator,
            )

            ProjectMember.objects.create(
                project_key=project, user_key=creator, permissions=4
            )

            datasets = [
                Dataset(
                    **{
                        "name": d["File Accession"] + "." + d["File Format"],
                        "source_url": d["Portal URL"],
                        "file_type": d["File Format"],
                        "data_type": d["Assay"],
                    },
                    project_key=project,
                )
                for d in file_data
            ]
            created_datasets = Dataset.objects.bulk_create(datasets)
            tag_datasets(created_datasets, file_data)
