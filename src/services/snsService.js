const { PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = require("../config/awsConfig");

const sendEmailUsingSNS = async (subject, message) => {
  const params = {
    Message: message,
    Subject: subject,
    TopicArn: process.env.SNS_TOPIC_ARN,
  };

  try {
    const command = new PublishCommand(params);
    const response = await snsClient.send(command);
    console.log('Email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending email via SNS:', error);
    throw error;
  }
};

module.exports = { sendEmailUsingSNS };