import path from "path";

export interface AppConfig {
  databaseDir: string;
  filesDir: string;
  dbFilePath: string;
  seedFilePath: string;
  pdfJsBuildDir: string;
  maxUploadBytes: number;
}

const DEFAULT_DB_DIR = "database";
const DEFAULT_FILES_SUBDIR = "files";
const DEFAULT_MAX_UPLOAD_MB = 60;

/**
 * 從環境變數讀取系統路徑與上傳限制設定
 */
export function getAppConfig(): AppConfig {
  const rootDir = process.cwd();
  const dbDirEnv = process.env.PPAP_DATABASE_DIR || DEFAULT_DB_DIR;
  const filesSubdirEnv = process.env.PPAP_FILES_SUBDIR || DEFAULT_FILES_SUBDIR;
  const maxUploadMb = Number(process.env.PPAP_MAX_UPLOAD_MB) || DEFAULT_MAX_UPLOAD_MB;

  const databaseDir = path.isAbsolute(dbDirEnv) ? dbDirEnv : path.join(rootDir, dbDirEnv);
  const filesDir = path.join(databaseDir, filesSubdirEnv);

  return {
    databaseDir,
    filesDir,
    dbFilePath: path.join(databaseDir, "drawings_db.json"),
    seedFilePath: path.join(databaseDir, "seed_data.json"),
    pdfJsBuildDir: path.join(rootDir, "node_modules", "pdfjs-dist", "build"),
    maxUploadBytes: maxUploadMb * 1024 * 1024,
  };
}
