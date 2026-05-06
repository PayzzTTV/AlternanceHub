FROM python:3.11-alpine

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN addgroup -S appgroup \
    && adduser -S -u 1000 -G appgroup appuser

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app/scraper

USER 1000:1000

CMD ["python", "-m", "scraper.main"]
