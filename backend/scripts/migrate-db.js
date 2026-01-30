import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const OLD_DB_URI = 'mongodb://localhost:27017/visa-eli';
const NEW_DB_URI = process.env.MONGODB_URI;

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Connect to old database
    console.log('📡 Connecting to old database (localhost)...');
    const oldConn = await mongoose.createConnection(OLD_DB_URI);
    console.log('✅ Connected to old database\n');

    // Connect to new database
    console.log('📡 Connecting to new database (remote)...');
    const newConn = await mongoose.createConnection(NEW_DB_URI);
    console.log('✅ Connected to new database\n');

    // Get all collections from old database
    const oldDb = oldConn.db;
    const collections = await oldDb.listCollections().toArray();
    
    console.log(`📦 Found ${collections.length} collections to migrate:\n`);
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');

    // Migrate each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`🔄 Migrating collection: ${collectionName}...`);

      // Get all documents from old collection
      const documents = await oldDb.collection(collectionName).find({}).toArray();
      console.log(`   Found ${documents.length} documents`);

      if (documents.length > 0) {
        // Insert into new database
        const newDb = newConn.db;
        await newDb.collection(collectionName).insertMany(documents);
        console.log(`   ✅ Migrated ${documents.length} documents\n`);
      } else {
        console.log(`   ⚠️  No documents to migrate\n`);
      }
    }

    console.log('✅ Database migration completed successfully!');
    
    // Close connections
    await oldConn.close();
    await newConn.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateDatabase();

