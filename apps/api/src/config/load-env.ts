import path from 'node:path';
import dotenv from 'dotenv';

// Workspace commands may run from the repository root or apps/api.
// Load the first matching values without overriding variables provided by hosting.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
