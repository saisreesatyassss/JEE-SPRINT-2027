import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }
  const candidates = [
    new URL('../../firebase-applet-config.json', import.meta.url),
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
  ];
  for (const filePath of candidates) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as { projectId?: string };
      if (parsed.projectId) return parsed.projectId;
    } catch {
      // Try next location
    }
  }
  return undefined;
}

if (!getApps().length) {
  const projectId = getFirebaseProjectId();
  initializeApp(projectId ? { projectId } : {});
}

export const adminAuth = getAuth();
