import { SQSEvent } from "aws-lambda";
import { Readable } from 'stream';
import { S3Service } from '../core/services/s3.service';
import { sendToSQS } from '../core/services/sqs.service';
import { Resource } from "sst";
import { chunkArray } from "../core/utils/chunkArray";

export async function handler(
  event: SQSEvent
): Promise<{ status: string }> {
  const storageClient = new S3Service();
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const fileKey = body.Records[0].s3.object.key

    const s3Object = await storageClient.getObject(Resource["import-dump-bkt"].name, fileKey);
    const stream = Readable.from(s3Object);

    let data = '';
    const result: any = await new Promise((resolve, reject) => {
        stream.on("data", (chunk) => {
            data = data + chunk.toString();
        });
        
        stream.on("end", () => {
            resolve(data)
        });
        
        stream.on("error", (err) => {
            console.error("Stream error:", err);
            reject(err)
        });
    })
    const parsedData = JSON.parse(result)
    const batches = chunkArray(parsedData.employees, 100)
    const promises: any = []
    for (const batch of batches) {
        promises.push(sendToSQS(Resource["save-employees-q"].url, batch.map(emp => ({ ...emp, customerId: parsedData.customerId, importId: parsedData.importId }))));
    }
    await Promise.all(promises);
  }
  return { status: "Processed" };
}