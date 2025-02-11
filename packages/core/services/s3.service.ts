import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Service {
  s3: S3Client;

  constructor () {
    this.s3 = new S3Client({ region: 'eu-central-1' });
  }

  async putObject(bucket: string, key: string, data: string, contentType: string) {
    const s3Params = {
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType:  contentType
    };

    const command = new PutObjectCommand(s3Params);
    return await this.s3.send(command);
  }

  async getObject(bucket: string, key: string): Promise<any> {
    const s3Params = {
      Bucket: bucket,
      Key: key,
    };

    const command = new GetObjectCommand(s3Params);
    const response = await this.s3.send(command);

    return response.Body
  }
}