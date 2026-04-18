const AWS = require('aws-sdk');

const useS3 = process.env.USE_S3 === 'true';

let s3 = null;
let awsConfig = null;

if (useS3) {
    awsConfig = {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3: {
            bucket: process.env.S3_BUCKET_NAME
        }
    };

    AWS.config.update({
        region: awsConfig.region,
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey
    });

    s3 = new AWS.S3();
}

module.exports = {
    s3,
    awsConfig,
    useS3
};
