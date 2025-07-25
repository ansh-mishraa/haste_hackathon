const socketService = {
  io: null,

  initializeSocket(io) {
    this.io = io;

    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Join a buying group room
      socket.on('join_group', (groupId) => {
        socket.join(`group_${groupId}`);
        console.log(`Socket ${socket.id} joined group ${groupId}`);
      });

      // Leave a buying group room
      socket.on('leave_group', (groupId) => {
        socket.leave(`group_${groupId}`);
        console.log(`Socket ${socket.id} left group ${groupId}`);
      });

      // Handle group chat messages
      socket.on('group_message', (data) => {
        const { groupId, vendorId, message, vendorName } = data;
        
        // Broadcast message to all group members
        socket.to(`group_${groupId}`).emit('new_message', {
          groupId,
          vendorId,
          vendorName,
          message,
          timestamp: new Date().toISOString()
        });
      });

      // Handle quick messages
      socket.on('quick_message', (data) => {
        const { groupId, vendorId, messageType, vendorName } = data;
        
        socket.to(`group_${groupId}`).emit('quick_message', {
          groupId,
          vendorId,
          vendorName,
          messageType,
          timestamp: new Date().toISOString()
        });
      });

      // Handle group updates
      socket.on('group_update', (data) => {
        const { groupId, updateType, data: updateData } = data;
        
        socket.to(`group_${groupId}`).emit('group_updated', {
          groupId,
          updateType,
          data: updateData,
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  },

  // Send notification to specific group
  notifyGroup(groupId, event, data) {
    if (this.io) {
      this.io.to(`group_${groupId}`).emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Send notification to all connected clients
  broadcast(event, data) {
    if (this.io) {
      this.io.emit(event, {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
  }
};

module.exports = socketService; 