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

RUN cd core

EXPOSE 8000

RUN chmod +x  /app/entrypoint.sh
 
CMD ["/app/entrypoint.sh"]