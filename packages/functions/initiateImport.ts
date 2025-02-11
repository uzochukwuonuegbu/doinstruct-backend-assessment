import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Resource } from "sst";
import { uuid } from "uuidv4";
import { generateEmployees, validateEmployees } from '../core/services/employee.validator';
import { Customer, authMiddleware } from '../core/services/auth.middleware';
import { DynamoDBService } from "../core/services/dynamoDb.service";
import { S3Service } from "../core/services/s3.service";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'No body passed' }),
    };
  }
  let customer: Customer
  try {
    customer = authMiddleware(event);
  } catch (err: any) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Authentication failed' }),
    };
  }
  const data = JSON.parse(event.body);
  const { employee } = data

  const employees = generateEmployees(employee);
  const { validEmployees, errors } = validateEmployees(employees);

  try {
    const importId = uuid();
    const fileKey = `imports/${customer.customerId}/${importId}.json`;
  
    const storageClient = new S3Service();
    await storageClient
      .putObject(Resource["import-dump-bkt"].name,
      fileKey,
      JSON.stringify({ importId, customerId: customer.customerId, employees: validEmployees }),
      "application/json");

    const createdAt = new Date().toISOString();
    const dbClient = new DynamoDBService()
    await dbClient.putItem(Resource.ImportReportTable.name, {
      customerId: customer.customerId,
      importId,
      failureCount: errors.length,
      errors: JSON.stringify(errors),
      successCount: 0,
      createdAt,
      totalValidCount: validEmployees.length
    })
  
    return {
      statusCode: 202,
      body: JSON.stringify({ importId, message: "Import started successfully" }),
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unable to initiate import' }),
    };
  }
}