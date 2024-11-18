const express = require("express");
const notificationController = require("../controllers/notificationController");

const createNotificationRoutes = (mongoose, auth) => {
  const router = express.Router();

  router.post('/notifications', (req, res, next) => 
    notificationController.createNotification(req, res, next, mongoose)
  );

  router.get('/notifications', auth, (req, res, next) => 
    notificationController.getNotifications(req, res, next, mongoose)
  );

  router.put('/notifications/:id/read', auth, (req, res, next) => 
    notificationController.markNotificationAsRead(req, res, next, mongoose)
  );

  router.put('/notifications/mark-all-read', auth, (req, res, next) => 
    notificationController.markAllAsRead(req, res, next, mongoose)
  );

  return router;
};

module.exports = createNotificationRoutes;