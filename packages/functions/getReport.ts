import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBService } from "../core/services/dynamoDb.service";
import { Customer, authMiddleware } from "../core/services/auth.middleware";
import { Resource } from "sst";

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters?.id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No importId passed" }),
    };
  }
  let customer: Customer
  try {
    customer = authMiddleware(event);
  } catch (err: any) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Authentication failed" }),
    };
  }

  const importId = event.pathParameters?.id;

  if (!importId || !customer.customerId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "CustomerID and importId are required" }),
    };
  }

  try {
    const dbClient = new DynamoDBService();
    const response = await dbClient.getItem(Resource.ImportReportTable.name,
    { customerId: customer.customerId, importId })

    if (!response.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Import report not found" }),
      };
    }
    const record = unmarshall(response.Item);

    return {
      statusCode: 200,
      body: JSON.stringify({ data: record }),
    };
  } catch (err) {
    console.log("Error fetching import report:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Unable to get report' }),
    };
  }
}
