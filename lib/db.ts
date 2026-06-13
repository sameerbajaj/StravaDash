import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Helper to copy SQLite db to /tmp in serverless environment
function setupDatabase() {
  if (process.env.NODE_ENV === 'production') {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.startsWith('file:/tmp/')) {
      const dbPath = dbUrl.replace('file:', '');
      if (!fs.existsSync(dbPath)) {
        console.log(`SQLite database not found at ${dbPath}, initializing...`);
        try {
          // Statically analyze to force Next.js file tracing
          if (process.env.STATIC_TRACE_TRIGGER === 'never_true') {
            fs.readFileSync(path.join(process.cwd(), 'prisma/template.db'));
          }

          const srcPaths = [
            path.join(process.cwd(), 'prisma', 'template.db'),
            path.join(process.cwd(), 'template.db'),
            path.join(__dirname, '..', 'prisma', 'template.db'),
            path.join(__dirname, 'prisma', 'template.db'),
          ];
          
          let copied = false;
          for (const srcPath of srcPaths) {
            if (fs.existsSync(srcPath)) {
              const destDir = path.dirname(dbPath);
              if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
              }
              fs.copyFileSync(srcPath, dbPath);
              console.log(`Successfully copied template database from ${srcPath} to ${dbPath}`);
              copied = true;
              break;
            }
          }
          if (!copied) {
            console.error(`Could not find template SQLite database in search paths: ${srcPaths.join(', ')}`);
          }
        } catch (err) {
          console.error('Error copying template SQLite database:', err);
        }
      } else {
        console.log(`SQLite database already exists at ${dbPath}`);
      }
    }
  }
}

setupDatabase();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
