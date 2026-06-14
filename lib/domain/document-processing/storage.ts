import { createId } from "@/lib/utils";
import type { DocumentSourceType } from "@/types/document-processing";
import type { DocumentStorageLayer, StoredDocumentFile } from "./contracts";
import { assertSafeDocumentFile } from "./security";

export class BrowserDocumentStorageLayer implements DocumentStorageLayer {
  private readonly memoryStorage = new Map<string, StoredDocumentFile>();

  constructor(private readonly namespace = "work") {}

  async store(file: File, sourceType: DocumentSourceType): Promise<StoredDocumentFile> {
    const fileType = assertSafeDocumentFile(file);
    const storedFile: StoredDocumentFile = {
      id: createId("stored-document"),
      file,
      fileName: file.name,
      fileType,
      sourceType,
      createdAt: new Date().toISOString()
    };

    this.memoryStorage.set(storedFile.id, storedFile);
    await this.tryPersistToIndexedDb(storedFile);
    return storedFile;
  }

  async get(id: string): Promise<StoredDocumentFile | null> {
    return this.memoryStorage.get(id) ?? (await this.tryReadFromIndexedDb(id));
  }

  async remove(id: string): Promise<void> {
    this.memoryStorage.delete(id);

    if (!canUseIndexedDb()) {
      return;
    }

    const database = await openDatabase(this.namespace);
    await runStoreRequest(database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id));
  }

  private async tryPersistToIndexedDb(file: StoredDocumentFile) {
    if (!canUseIndexedDb()) {
      return;
    }

    const database = await openDatabase(this.namespace);
    await runStoreRequest(database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(file));
  }

  private async tryReadFromIndexedDb(id: string) {
    if (!canUseIndexedDb()) {
      return null;
    }

    const database = await openDatabase(this.namespace);
    return runStoreRequest<StoredDocumentFile | undefined>(database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id)).then(
      (value) => value ?? null
    );
  }
}

const DATABASE_NAME_PREFIX = "vospitanie-pro-document-processing";
const STORE_NAME = "files";

function canUseIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDatabase(namespace: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(`${DATABASE_NAME_PREFIX}-${namespace}`, 1);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function runStoreRequest<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
