# Doinstruct Backend Assessment

## How to Run the Code

### Prerequisites
Ensure you have the following installed:

- Node.js (>=20.x)

- AWS CLI configured with appropriate credentials

For convenience, here are my AWS KEYS
```
- Region: 'eu-central-'1'
- Access Key ID: 'AKIAU5LH552OFVFRBU6M'
- Secret Access Key: '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'
```

- SST (Serverless Stack) installed globally (`npm install -g sst`)

### Running the Application Locally
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/doinstruct-backend.git
   cd doinstruct-backend-assessment
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the local development environment:
   ```sh
   npm run dev
   ```

### Deploying to AWS
1. Deploy the stack to AWS:
   ```sh
   npm run deploy
   ```
   Look for the API Gateway URL under `APIUrl`.


### Example Deployed Endpoints
- Import Employees: `POST https://uweh6g3dqj.execute-api.eu-central-1.amazonaws.com/import`
```curl --request POST \
  --url https://uweh6g3dqj.execute-api.eu-central-1.amazonaws.com/import \
  --header 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsImN1c3RvbWVySWQiOiIxYzIyMmQ1Yy0yZjExLTQ2ODQtOTZmYi01NDQ3YWJlMTg2YTMiLCJpYXQiOjE3MzkzMTAwODIsImV4cCI6MTczOTMxMzY4Mn0.i64nGqsWF3NYQ8876ASqKvFVRuSVwLnCcNGw7CKUOTI' \
  --header 'Content-Type: application/json' \
  --header 'User-Agent: insomnia/9.3.3' \
  --data '{
	"employees": []
}'
```
Remeber to regenerate `Authorization`


- Get Import Report: `GET https://uweh6g3dqj.execute-api.eu-central-1.amazonaws.com/report/{importId}`


## Authentication & Generating JWT Token
The application uses JWT authentication. To generate a token:

1. Ensure you have the `generate-auth-token.js` file.
2. Run the script:
   ```sh
   node generate-auth-token.js
   ```
3. The token will be printed in the console. Use it in API requests:
   ```sh
   curl -H "Authorization: YOUR_TOKEN" https://uweh6g3dqj.execute-api.eu-central-1.amazonaws.com/report/{id}
   ```

## Generating Employees Payload (Optional, if you already have a payload)
You can generate employees by running the generate-employees script -- remember to change the count, and download as needed (I already tested with different payloads up to 10,000 employees):

1. Ensure you have the `generate-employees.js` file.
2. Run the script:
   ```sh
   node generate-employees.js
   ```


## Improvements if More Time Were Available ---

### 1. Bypass API Gateway Memory Upload Size Limit
- API Gateway has a payload limit of **10MB**.
- Instead of sending large JSON payloads, generate a **pre-signed S3 URL**.
- The client uploads the JSON file directly to S3.

### 2. Implement API Key Usage Plan on AWS
- Introduce **API keys** with usage plans to manage quotas and throttling.
- Different plans for different customers (e.g., Free, Pro, Enterprise).

### 3. Use Lambda Layers for Shared Functionality
- Move shared logic (like `authMiddleware`) to a **Lambda Layer**.
- Reduces redundancy and makes updates easier.

### 4. Separate Each Stack Into Its Own File
- Currently, all stack definitions are in a single file.
- Breaking it down into separate files (`EmployeeStack.ts`, `AuthStack.ts`, etc.) improves readability and maintainability.

