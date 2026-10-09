import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from backend root directory regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // Fallback load
