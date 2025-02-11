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

    return {
      EmployeeTableName: employeeTable.name,
      ImportReportTable: importReportTable.name,

      importBucket: importBucket.name,
    };
  },
});
