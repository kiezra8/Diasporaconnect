#!/bin/bash
# ==============================================================================
# Diaspora Connect - Automated Encrypted PostgreSQL Backup Script
# Encryption: AES-256-CBC with OpenSSL
# ==============================================================================

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/diaspora_connect"
ENC_PASS="${BACKUP_ENCRYPTION_KEY:-DiasporaBackupSecretKey2026!}"
DB_NAME="diaspora_connect_db"
DB_USER="dc_admin"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting encrypted database backup..."

# Dump and encrypt in pipeline
docker exec -t diaspora-connect-postgres-1 pg_dump -U "$DB_USER" "$DB_NAME" \
    | gzip -9 \
    | openssl enc -aes-256-cbc -salt -pbkdf2 -pass pass:"$ENC_PASS" \
    > "$BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz.enc"

# Retain only last 30 daily backups
find "$BACKUP_DIR" -type f -name "*.enc" -mtime +30 -exec rm {} \;

echo "[$(date)] Encrypted backup completed: $BACKUP_DIR/db_${DB_NAME}_${TIMESTAMP}.sql.gz.enc"

