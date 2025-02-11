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

    return {
      EmployeeTableName: employeeTable.name,
      ImportReportTable: importReportTable.name
    };
  },
});
