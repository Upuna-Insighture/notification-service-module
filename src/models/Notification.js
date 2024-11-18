// In your custom npm module (e.g., notificationModel.js)
module.exports = (mongoose) => {
  // Schema to track status changes for each recipient
  const statusHistorySchema = new mongoose.Schema({
    status: { type: String, enum: ['unread', 'read'], required: true },
    changedAt: { type: Date, default: Date.now },
  });

  // Schema for recipient details with current status and history
  const recipientSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['unread', 'read'], default: 'unread' },
    updatedAt: { type: Date, default: Date.now },
    history: [statusHistorySchema], // Track status change history
  });

  // Main notification schema
  const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['email', 'push'], required: true },
    recipients: {
      type: [recipientSchema],
      validate: {
        validator: function (value) {
          return this.type === 'push' ? value.length > 0 : value.length === 0;
        },
        message: 'Recipients are only allowed for PushNotification notifications.',
      },
    },
    createdAt: { type: Date, default: Date.now },
  });

  return mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
};