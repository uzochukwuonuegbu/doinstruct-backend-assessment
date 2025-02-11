import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const sendToSQS = async (queueUrl: string, batch: any[]) => {
    try {
        const params = {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(batch),
        };

        await new SQSClient().send(new SendMessageCommand(params));
        console.log(`Pushed ${batch.length} chunks to the queue.`);
    } catch (err) {
        console.error("Error sending to SQS:", err);
    }
};
