#!/usr/bin/env bash

python ./core/manage.py migrate --noinput
# python ./core/manage.py ingest_datasets
python -m gunicorn --certfile=./certbot/conf/live/vis-api.link/fullchain.pem --keyfile=./certbot/conf/live/vis-api.link/privkey.pem --bind 0.0.0.0:8000 --chdir core core.wsgi:application