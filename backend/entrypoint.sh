#!/usr/bin/env bash

python ./core/manage.py migrate --noinput
# python ./core/manage.py ingest_datasets
python -m gunicorn --certfile=/etc/letsencrypt/live/34.227.19.8/fullchain.pem --keyfile=/etc/letsencrypt/live/34.227.19.8/privkey.pem --bind 0.0.0.0:443 --chdir core core.wsgi:application