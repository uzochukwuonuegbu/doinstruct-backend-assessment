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
        phoneNumber: "string",
        createdAt: "string",
      },
      primaryIndex: { hashKey: "customerId", rangeKey: "employeeId" },
      localIndexes: {
        CreatedAtIndex: { rangeKey: "createdAt" },
        ImportIdIndex: { rangeKey: "importId" },
        PhoneNumberIndex: { rangeKey: "phoneNumber" }
      },
    });
    const importReportTable = new sst.aws.Dynamo("ImportReportTable", {
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
    const importBucket = new sst.aws.Bucket("import-dump-bkt", {
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
    const processImportsQueue = new sst.aws.Queue("process-imports-q", {
      dlq: processImportsDLQ.arn,
    });

    const saveEmployeesDLQ = new sst.aws.Queue("save-employees-deadletterq");
    const saveEmployeesQueue = new sst.aws.Queue("save-employees-q", {
      dlq: saveEmployeesDLQ.arn
    });


    // Pub-Sub..
    processImportsQueue.subscribe({
      handler: "packages/functions/processImport.handler",
      link: [saveEmployeesQueue, importBucket]
    })
    saveEmployeesQueue.subscribe({
      handler: "packages/functions/saveEmployees.handler",
      link: [employeeTable, importReportTable],
      concurrency: {
        reserved: 2
      }
    })
    importBucket.notify({
      notifications: [
        {
          name: "objectCreatedNotification",
          queue: processImportsQueue,
          events: ["s3:ObjectCreated:*"],
        },
      ],
    });


    // API Gateway..
    const api = new sst.aws.ApiGatewayV2("EmployeeApiV1");

    api.route("POST /import", {
      handler: "packages/functions/initiateImport.handler",
      link: [importBucket, importReportTable, secret],
    });
    api.route("GET /report/{id}", {
      handler: "packages/functions/getReport.handler",
      link: [importReportTable, secret],
    });

    return {
      EmployeeTableName: employeeTable.name,
      ImportReportTable: importReportTable.name,

      ImportBucket: importBucket.name,

      ProcessImportsQueue: processImportsQueue.url,
      ProccessImportsDLQ: processImportsDLQ.url,
      SaveEmployeesQueue: saveEmployeesQueue.url,
      SaveEmployeesDLQ: saveEmployeesDLQ.url,

      APIUrl: api.url,
    };
  },
});
