/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

declare module "sst" {
  export interface Resource {
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
  }
}
/// <reference path="sst-env.d.ts" />

import "sst"
export {}