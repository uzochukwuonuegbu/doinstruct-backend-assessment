/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

declare module "sst" {
  export interface Resource {
    "EmployeeApiV1": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "EmployeeTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "ImportReportTable": {
      "name": string
      "type": "sst.aws.Dynamo"
    }
    "JwtToken": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "import-dump-bkt": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "process-imports-deadletterq": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "process-imports-q": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "save-employees-deadletterq": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "save-employees-q": {
      "type": "sst.aws.Queue"
      "url": string
    }
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}