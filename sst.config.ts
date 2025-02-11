/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "doinstruct-backend-assessment",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      region: "eu-central-1",
    };
  },
  async run() {
    const secret = new sst.Secret("JwtToken", "most-secret-token");

    // Database..
    const employeeTable = new sst.aws.Dynamo("EmployeeTable", {
      fields: {
        customerId: "string",
        employeeId: "string",
        importId: "string",
        createdAt: "string",
      },
      primaryIndex: { hashKey: "customerId", rangeKey: "employeeId" },
      localIndexes: {
        CreatedAtIndex: { rangeKey: "createdAt" },
        ImportIdIndex: { rangeKey: "importId" }
      },
      stream: "keys-only",
    });
    const employeeImportReportTable = new sst.aws.Dynamo("EmployeeImportReportTable", {
      fields: {
        customerId: "string",
        importId: "string",
        createdAt: "string",
      },
      primaryIndex: { hashKey: "customerId", rangeKey: "importId" },
      localIndexes: {
        CreatedAtIndex: { rangeKey: "createdAt" }
      }
    });

    // Storage..
    const bucket = new sst.aws.Bucket("import-dump-bkt", {
      access: 'public',
      transform: {
        policy: (args) => {
          args.policy = sst.aws.iamEdit(args.policy, (policy) => {
            policy.Statement.push({
              Effect: "Allow",
              Principal: { Service: "lambda.amazonaws.com" },
              Action: "s3:GetObject",
              Resource: $interpolate`arn:aws:s3:::${args.bucket}/*`,
            });
          });
        },
      },
    });


    // Queues (and dlq)..
    const processImportsDLQ = new sst.aws.Queue("process-imports-deadletterq");
    const saveImportsDLQ = new sst.aws.Queue("save-imports-deadletterq");
    const processImportsQueue = new sst.aws.Queue("process-imports-q", {
      dlq: processImportsDLQ.arn,
    });
    const saveImportsQueue = new sst.aws.Queue("save-imports-q", {
      dlq: saveImportsDLQ.arn
    });


    // Pub-Sub..
    processImportsQueue.subscribe({
      handler: 'packages/functions/processImports.handler',
      link: [saveImportsQueue, bucket]
    })
    saveImportsQueue.subscribe({
      handler: 'packages/functions/saveImports.handler',
      link: [employeeTable, employeeImportReportTable],
      concurrency: {
        reserved: 2
      }
    })
    bucket.notify({
      notifications: [
        {
          name: 'objectCreatedNotification',
          queue: processImportsQueue,
          events: ["s3:ObjectCreated:*"],
        },
      ],
    });


    // API Gateway..
    const api = new sst.aws.ApiGatewayV2("EmployeeApiV1");

    api.route("POST /import", {
      handler: "packages/functions/initiateImports.handler",
      link: [bucket, employeeImportReportTable, secret],
    });
    api.route("GET /report/{id}", {
      handler: "packages/functions/getImportReports.handler",
      link: [employeeImportReportTable, secret],
    });

    return {
      bucket: bucket.name,
      queue: processImportsQueue.url,
      api: api.url,
    };
  },
});
