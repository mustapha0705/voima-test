import { S3Client } from "@aws-sdk/client-s3"
import dotenv from 'dotenv';
dotenv.config();

const awsRegion = process.env.AWS_REGION
const awsAccessKey = process.env.AWS_ACCESS_KEY
const awsSecretAcessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3Client = new S3Client({
    credentials: {
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretAcessKey
    },
    region: awsRegion
});

export default s3Client;
