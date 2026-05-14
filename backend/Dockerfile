FROM python:3.13-slim AS builder

RUN mkdir /app
 
WORKDIR /app
 
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1 
 
RUN apt-get update && apt-get install -y curl
RUN pip install --upgrade pip 
 
COPY requirements.txt  /app/
 
RUN pip install --no-cache-dir -r requirements.txt
 
COPY . /app/

# Collect static files into STATIC_ROOT so WhiteNoise can serve them at
# runtime. settings.py reads several env vars at import time; we pass
# dummy values just to make Django boot (none of these are written
# anywhere, the manifest just needs the settings module to load).
RUN SECRET_KEY=build \
    DEBUG=false \
    ALLOWED_HOSTS=build \
    ALLOWED_ORIGINS=http://build \
    ECS_CONTAINER_METADATA_URI_V4= \
    DB_ENGINE=django.db.backends.sqlite3 \
    DB_NAME=build \
    DB_USER=build \
    DB_PASSWORD=build \
    DB_HOST=build \
    DB_PORT=0 \
    python ./core/manage.py collectstatic --noinput

EXPOSE 8000

RUN chmod +x  /app/entrypoint.sh
 
CMD ["/app/entrypoint.sh"]