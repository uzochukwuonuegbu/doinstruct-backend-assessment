import { Resource } from 'sst';
import { DynamoDBClient, TransactWriteItemsCommand, TransactWriteItemsCommandInput, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import {DynamoDBDocumentClient} from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { chunk } from "lodash";

export class DynamoDBService {
    private dynamoDbClient: DynamoDBClient;
    private MAX_RETRIES: number;
    protected MAX_BATCH_SIZE: number = 25;
  
    constructor (private maxRetries: number = 7) {
        const client = new DynamoDBClient();
        this.dynamoDbClient = DynamoDBDocumentClient.from(client, {
            marshallOptions: {
                removeUndefinedValues: true
            }
          });
        this.MAX_RETRIES = this.maxRetries;
    }
  
    async batchTransactionWrite(input: TransactWriteItemsCommandInput) {  
      await this.dynamoDbClient.send(new TransactWriteItemsCommand(input));
    }

    async getItem(tableName: string, key: { [x:string]: string }) {  
      const command = new GetItemCommand({
        TableName: tableName,
        Key: marshall(key),
      });
  
      return await this.dynamoDbClient.send(command);
    }

    async putItem(tableName: string, input: { [x:string]: any }) {  
      const command = new PutItemCommand({
        TableName: tableName,
        Item: marshall(input),
      });
  
      return await this.dynamoDbClient.send(command);
    }

    private async executeTransactWrite(transactItems: TransactWriteItemsCommandInput) {
      let attempt = 0;
      while (attempt < this.MAX_RETRIES) {
        try {
          await this.dynamoDbClient.send(new TransactWriteItemsCommand(transactItems));
          console.log("Transaction successful");
          return;
        } catch (error: any) {
          console.log({ error });
    
          if (error.name === "TransactionCanceledException") {
            // Check if any reason is ConditionalCheckFailed
            if (error.CancellationReasons?.some((r: any) => r.Code === "ConditionalCheckFailed")) {
              console.warn("Skipping retry due to ConditionalCheckFailed");
              throw error; // Immediately throw instead of retrying
            }
    
            attempt++;
            const waitTime = Math.pow(3, attempt) * 100; // Exponential backoff
            console.warn(`TransactionConflict detected. Retrying in ${waitTime}ms... (Attempt ${attempt})`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          } else {
            console.error("Transaction failed with an error:", error);
            throw error;
          }
        }
      }
    
      throw new Error("Max retries reached for transaction");
    }
    

    async runEmployeeImportTransactions(data: any[][]) {
      const batches = chunk(data, this.MAX_BATCH_SIZE);
    
      for (const batch of batches) {
        const transactItems: any[] = [];
        const failedItems: any[] = [];
    
        batch.forEach((item) => {
          transactItems.push({
            Put: {
              ConditionExpression: "attribute_not_exists(#employeeId) AND attribute_not_exists(#phoneNumber)",
              ExpressionAttributeNames: { "#employeeId": "employeeId", "#phoneNumber": "phoneNumber" },
              Item: marshall(item),
              TableName: Resource.EmployeeTable.name,
            },
          });
        });
    
        const uniqueKeys = new Set(batch.map((item) => `${item.customerId}:${item.importId}`));
    
        uniqueKeys.forEach((key) => {
          const [customerId, importId] = key.split(":");
    
          transactItems.push({
            Update: {
              ExpressionAttributeNames: { "#successCount": "successCount" },
              ExpressionAttributeValues: marshall({
                ":successCount": batch.filter((item) => item.customerId === customerId && item.importId === importId).length,
              }),
              Key: marshall({ customerId, importId }),
              TableName: Resource.ImportReportTable.name,
              UpdateExpression: "ADD #successCount :successCount",
            },
          });
        });
    
        try {
          await this.executeTransactWrite({ TransactItems: transactItems });
          console.log(`Processed batch of ${batch.length} employees`);
        } catch (error: any) {
          console.error("Error processing batch:", error);
    
          if (error.name === "TransactionCanceledException" && error.CancellationReasons) {
            error.CancellationReasons.forEach((reason: any, index: number) => {
              if (reason.Code === "ConditionalCheckFailed") {
                failedItems.push(batch[index]);
              }
            });
          }
        }
    
        if (failedItems.length > 0) {
          console.log({ failedItems })
          await this.updateFailureCounts(uniqueKeys, failedItems);
        }
      }
    }

    private async updateFailureCounts(uniqueKeys: Set<any>, failedItems: any[]) {
      for (const key of uniqueKeys) {
        const [customerId, importId] = key.split(":");
        const failedCount = failedItems.filter((item) => item.customerId === customerId && item.importId === importId).length;
    
        let existingErrors: string[] = [];
        try {
          const report = await this.getItem(Resource.ImportReportTable.name, { customerId, importId });
          if (report?.Item) {
            const item = unmarshall(report.Item);
            existingErrors = JSON.parse(item.errors);
          }
        } catch (fetchError) {
          console.error("Error fetching existing errors:", fetchError);
        }
    
        const newErrors = failedItems.map(
          (item) => `Employee ID: ${item.EmployeeID} - Failed due to ConditionExpression (duplicate entry)`
        );
    
        const updatedErrors = [...existingErrors, ...newErrors];
    
        const updateTransactItems = [
          {
            Update: {
              ExpressionAttributeNames: { "#failureCount": "failureCount", "#totalValidCount": "totalValidCount", "#errors": "errors" },
              ExpressionAttributeValues: marshall({
                ":failureCount": failedCount,
                ":decrementValidCount": -failedCount,
                ":errors": JSON.stringify(updatedErrors),
              }),
              Key: marshall({ customerId, importId }),
              TableName: Resource.ImportReportTable.name,
              UpdateExpression: "ADD #failureCount :failureCount, #totalValidCount :decrementValidCount SET #errors = :errors",
            },
          },
        ];
    
        try {
          await this.executeTransactWrite({ TransactItems: updateTransactItems });
          console.log(`Updated failure count and errors for ${failedItems.length} employees`);
        } catch (updateError) {
          console.error("Error updating failure count and errors:", updateError);
        }
      }
    }
    
  }