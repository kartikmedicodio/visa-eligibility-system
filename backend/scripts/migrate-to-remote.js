import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const OLD_DB = 'mongodb://localhost:27017/visa-eli';
// Use URL encoded password (%40 = @)
const NEW_DB = 'mongodb://relayzenAdminDb:ReLayZEn%402025@52.249.223.108:27017/visa-eli?authSource=admin';

const collections = ['applications', 'documents', 'eligibilityresults', 'visarules'];

async function migrate() {
  try {
    console.log('🔄 Starting database migration...\n');

    // Connect to old database
    console.log('📡 Connecting to local database...');
    const oldConn = await mongoose.createConnection(OLD_DB);
    await oldConn.asPromise();
    const oldDb = oldConn.db;
    console.log('✅ Connected to local database\n');

    // Connect to new database
    console.log('📡 Connecting to remote database...');
    const newConn = await mongoose.createConnection(NEW_DB);
    await newConn.asPromise();
    const newDb = newConn.db;
    console.log('✅ Connected to remote database\n');

    // Migrate each collection
    for (const collectionName of collections) {
      try {
        console.log(`🔄 Migrating collection: ${collectionName}...`);
        
        // Get all documents
        const documents = await oldDb.collection(collectionName).find({}).toArray();
        console.log(`   Found ${documents.length} documents`);

        if (documents.length > 0) {
          // Drop existing collection in new DB (optional - remove if you want to keep existing data)
          // await newDb.collection(collectionName).drop().catch(() => {});
          
          // Insert documents
          await newDb.collection(collectionName).insertMany(documents);
          console.log(`   ✅ Migrated ${documents.length} documents\n`);
        } else {
          console.log(`   ⚠️  No documents to migrate\n`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
      }
    }

    // Verify migration
    console.log('📊 Verifying migration...\n');
    for (const collectionName of collections) {
      const count = await newDb.collection(collectionName).countDocuments();
      console.log(`   ${collectionName}: ${count} documents`);
    }

    console.log('\n✅ Migration completed successfully!');
    
    await oldConn.close();
    await newConn.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();

