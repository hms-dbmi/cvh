FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir --require-hashes -r /tmp/requirements.txt

# udiagent reads the data from /data, which the task mounts read-only.
RUN useradd --create-home --uid 1000 udi
USER udi
WORKDIR /home/udi
# udiagent's server plus CVH's monthly budgets.
COPY cvh_yac.py .

EXPOSE 8000
# The ALB terminates TLS; trust its X-Forwarded-* headers.
CMD ["uvicorn", "cvh_yac:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
