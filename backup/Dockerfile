FROM alpine:3.19

# Install postgres client and dependencies
RUN apk add --no-cache \
    postgresql16-client \
    curl \
    libc6-compat \
    ca-certificates

# Install azcopy v10
RUN curl -sSL https://aka.ms/downloadazcopy-v10-linux | tar -xz && \
    cp azcopy_linux_amd64_*/azcopy /usr/bin/azcopy && \
    chmod +x /usr/bin/azcopy && \
    rm -rf azcopy_linux_amd64_*

WORKDIR /app

COPY backup.sh /app/backup.sh
RUN chmod +x /app/backup.sh

COPY crontab /etc/crontabs/root

ENTRYPOINT ["crond", "-f", "-l", "2"]
