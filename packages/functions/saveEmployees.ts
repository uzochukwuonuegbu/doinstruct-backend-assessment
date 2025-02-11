import { SQSEvent } from "aws-lambda";
import { DynamoDBService } from '../core/services/dynamoDb.service';

export async function handler(
  event: SQSEvent
): Promise<{ status: string }> {
  const dbClient = new DynamoDBService();
  for (const record of event.Records) {
    const body = JSON.parse(record.body)
    await dbClient.runEmployeeImportTransactions(body);
  }
  return { status: "Processed" };
}