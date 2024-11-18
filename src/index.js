const createNotificationRoutes = require('../src/routes/notificationRoutes');
const notificationController = require('../src/controllers/notificationController');
const socketIo = require('socket.io');
const socketHandler = require('./socket/socketHandler');

const initNotificationModule = (app, auth, mongoose, server) => {

  const io = socketIo(server, { cors: { origin: '*' } });

  socketHandler(io);
  app.use((req, res, next) => {
    req.io = io;  // Pass io instance to routes
    next();
  });
  
  const notificationRoutes = createNotificationRoutes(mongoose, auth);  
  app.use('/api', notificationRoutes);

  // notificationController.getNotifications(req, res, next, mongoose)

    // app.get('/notifications', (req, res, next) => 
      // notificationController.getNotifications(req, res, next, mongoose)
    // );

};

module.exports = { initNotificationModule }