import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import IStorageType from "../types/IStorageType";
import ICrudService from "../types/ICrudService";

export default abstract class StorageHelper<T extends IStorageType> implements ICrudService<T> {
  private blobPath: string;
  private vendorId: string;
  private runLocal = true;
  private signInOptions = {
    clientId: "06xed769-df6c-402e-972c-b0341045c873",
    tenantId: "62x53d6e-cd3a-42cf-9537-1c8e22abfe27"
  }
  private blobStorageClient =
    this.runLocal ?
      new BlobServiceClient(
        "http://127.0.0.1:10000/devstoreaccount1/",
        new StorageSharedKeyCredential("devstoreaccount1", 
        "Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw=="))
      :
      new BlobServiceClient(
        "https://nsbuddstr.blob.core.windows.net/",
        new DefaultAzureCredential(this.signInOptions));

  constructor(vendorId: string, blobName: string) {
    this.blobPath = blobName.concat("/");
    this.vendorId = vendorId;
  }

  private getBlobName = (id: string): string => {
    return this.blobPath.concat(id);
  }

  private getContainer = async (): Promise<ContainerClient> => {
    if (!this.vendorId) {
      throw new EvalError("vendorId must be defined");
    }

    let client = this.blobStorageClient.getContainerClient(this.vendorId);
    if (!await client.exists()) {
      const response = await this.blobStorageClient.createContainer(this.vendorId);
      client = response.containerClient;
    }
    return client;
  }

  private getItemIds = async (): Promise<string[]> => {
    const client = await this.getContainer();
    const itemNames: string[] = [];

    for await (const blob of client.listBlobsByHierarchy("/", { prefix: this.blobPath })) {
      itemNames.push(blob.name);
    }

    return itemNames;
  }

  private blobStreamToString = async (readableStream: NodeJS.ReadableStream): Promise<string> => {
    return new Promise((resolve, reject) => {
      const chunks: string[] = [];
      readableStream.on("data", (data) => {
        chunks.push(data.toString());
      });
      readableStream.on("end", () => {
        resolve(chunks.join(""));
      });
      readableStream.on("error", reject);
    });
  }

  private blobToString = async (blob: Blob): Promise<string> => {
    const fileReader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      fileReader.onloadend = (ev: ProgressEvent<FileReader>) => {
        resolve(ev.target?.result as string);
      };
      fileReader.onerror = reject;
      fileReader.readAsText(blob);
    });
  }

  private getBlobByName = async (blobName: string): Promise<T | undefined> => {
    const client = await this.getContainer();
    const blobClient = client.getBlobClient(blobName);
    const blob = await blobClient.download();
    
    if (blob.readableStreamBody) {
      const stringBlob = await this.blobStreamToString(blob.readableStreamBody);
      const item = JSON.parse(stringBlob) as T;
      return item;
    }
    else if (blob.blobBody) {
      const stringBlob = await this.blobToString(await blob.blobBody);
      const item = JSON.parse(stringBlob) as T;
      return item;
    }
    return undefined;
  }

  protected getItemsInternal = async (): Promise<T[]> => {
    const items: T[] = [];

    for await (const blobName of await this.getItemIds()) {
      const item = await this.getBlobByName(blobName);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  protected getItemByIdInternal = async (id: string): Promise<T | undefined> => {
    const blobName = this.getBlobName(id);
    return this.getBlobByName(blobName);
  }

  protected persistItemInternal = async (item: T): Promise<T> => {
    const client = await this.getContainer();
    const body = JSON.stringify(item);
    await client.uploadBlockBlob(this.getBlobName(item.id), body, Buffer.byteLength(body));
    return item;
  }

  protected deleteItemInternal = async (item: IStorageType): Promise<void> => {
    const client = await this.getContainer();
    await client.deleteBlob(this.getBlobName(item.id));
  }

  protected purgeCollectionInternal = async (): Promise<void> => {
    const client = await this.getContainer();

    for await (const blobName of await this.getItemIds()) {
      await client.deleteBlob(blobName);
    }
  }

  purgeUserData = async (): Promise<void> => {
    if (await this.blobStorageClient.getContainerClient(this.vendorId).exists()) {
      await this.blobStorageClient.deleteContainer(this.vendorId);
    }
  }

  abstract getItems: () => Promise<T[]>;
  abstract getItemById: (id: string) => Promise<T>;
  abstract persistItem: (item: T) => Promise<T>;
  abstract deleteItem: (id: string) => Promise<void>;
  abstract purgeCollection: () => Promise<void>;
}
