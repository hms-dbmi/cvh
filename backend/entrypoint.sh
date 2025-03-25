#!/usr/bin/env bash

python ./core/manage.py migrate --noinput
# python ./core/manage.py ingest_datasets
python -m gunicorn --bind 0.0.0.0:8000 --chdir core core.wsgi:application