const createNotification = require('../models/Notification');
const { sendEmailUsingSNS } = require('../services/snsService');

// Create a notification
exports.createNotification = async (req, res, next, mongoose) => {
  const Notification = createNotification(mongoose);
  try {
    const { title, message, userIds, notificationTypes } = req.body;

    if (!title || !message || !userIds || !notificationTypes) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const createdNotifications = [];

    // Handle push notifications
    if (notificationTypes.includes("push")) {
      const recipients = userIds.map((userId) => ({
        userId,
        status: 'unread',
        updatedAt: new Date(),
        history: [{ status: 'unread', changedAt: new Date() }],
      }));

      const pushNotification = new Notification({
        title,
        message,
        type: "push",
        recipients,
      });

      const savedPushNotification = await pushNotification.save();
      createdNotifications.push(savedPushNotification);

      // Emit notification to each recipient via Socket.io
      userIds.forEach((userId) => {
        req.io.to(userId).emit("notification", savedPushNotification);
      });
    }

    // Handle email notifications
    if (notificationTypes.includes("email")) {
      const emailNotification = new Notification({
        title,
        message,
        type: "email",
      });

      const savedEmailNotification = await emailNotification.save();
      createdNotifications.push(savedEmailNotification);

      // Send email using SNS
      await sendEmailUsingSNS(title, message);
    }

    res.status(201).json(createdNotifications);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification" });
  }
};

// Get notifications with pagination
exports.getNotifications = async (req, res, next, mongoose) => {
  try {
    const Notification = createNotification(mongoose);
    const { page = 1, size = 10 } = req.query;
    const limit = parseInt(size);
    const skip = (page - 1) * limit;

    // Fetch notifications for the specific user with pagination
    const notifications = await Notification.find({ 'recipients.userId': req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count all unread notifications for the user
    const unreadCount = await Notification.countDocuments({
      'recipients.userId': req.userId,
      'recipients.status': 'unread'
    });

    // Count total notifications for pagination purposes
    const totalNotifications = await Notification.countDocuments({
      'recipients.userId': req.userId
    });

    // Map notifications to include the recipient's status
    const userNotifications = notifications.map((notification) => {
      const recipientInfo = notification.recipients.find(
        (r) => r.userId.toString() === req.userId.toString()
      );
      return {
        ...notification.toObject(),
        status: recipientInfo.status,
      };
    });

    // Respond with the notifications, unread count, and total count
    res.json({ 
      notifications: userNotifications, 
      unreadCount, 
      totalNotifications 
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark a specific notification as read
exports.markNotificationAsRead = async (req, res, next, mongoose) => {
  const Notification = createNotification(mongoose);
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, 'recipients.userId': req.userId },
      { $set: { 'recipients.$.status': 'read' } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res, next, mongoose) => {
  const Notification = createNotification(mongoose);
  try {
    await Notification.updateMany(
      { 'recipients.userId': req.userId, 'recipients.status': 'unread' },
      { $set: { 'recipients.$.status': 'read' } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
};