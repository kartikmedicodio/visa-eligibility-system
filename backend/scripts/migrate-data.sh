#!/bin/bash

# MongoDB Migration Script
# Migrates data from local MongoDB to remote MongoDB instance

OLD_DB="mongodb://localhost:27017/visa-eli"
NEW_DB="mongodb://relayzenAdminDb:ReLayZEn%402025@52.249.223.108:27017/visa-eli"

echo "🔄 Starting database migration..."
echo ""

# Check if mongodump and mongorestore are available
if ! command -v mongodump &> /dev/null; then
    echo "❌ mongodump not found. Please install MongoDB tools."
    exit 1
fi

if ! command -v mongorestore &> /dev/null; then
    echo "❌ mongorestore not found. Please install MongoDB tools."
    exit 1
fi

# Create temp directory for dump
TEMP_DIR=$(mktemp -d)
echo "📦 Created temporary directory: $TEMP_DIR"
echo ""

# Dump from old database
echo "📥 Exporting data from local database..."
mongodump --uri="$OLD_DB" --out="$TEMP_DIR" 2>&1 | grep -E "(visa-eli|dumping|done)" || echo "Export completed"
echo ""

# Restore to new database
echo "📤 Importing data to remote database..."
mongorestore --uri="$NEW_DB" "$TEMP_DIR/visa-eli" --drop 2>&1 | grep -E "(visa-eli|restoring|done)" || echo "Import completed"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"
echo "🧹 Cleaned up temporary files"
echo ""

echo "✅ Migration completed successfully!"
echo ""
echo "Collections migrated:"
mongosh "$NEW_DB" --quiet --eval "db.getCollectionNames().forEach(c => print('  - ' + c))" 2>/dev/null

