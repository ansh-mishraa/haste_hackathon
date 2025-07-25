import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendGroupMessage: (groupId: string, vendorId: string, message: string, vendorName: string) => void;
  sendQuickMessage: (groupId: string, vendorId: string, messageType: string, vendorName: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGroup: () => {},
  leaveGroup: () => {},
  sendGroupMessage: () => {},
  sendQuickMessage: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    setSocket(socketInstance);

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
    });

    // Global event listeners for notifications
    socketInstance.on('new_group_formed', (data) => {
      console.log('New group formed:', data);
      // Handle new group notification
    });

    socketInstance.on('group_ready_for_bids', (data) => {
      console.log('Group ready for bids:', data);
      // Handle group bidding notification
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinGroup = (groupId: string) => {
    if (socket) {
      socket.emit('join_group', groupId);
      console.log(`Joined group: ${groupId}`);
    }
  };

  const leaveGroup = (groupId: string) => {
    if (socket) {
      socket.emit('leave_group', groupId);
      console.log(`Left group: ${groupId}`);
    }
  };

  const sendGroupMessage = (groupId: string, vendorId: string, message: string, vendorName: string) => {
    if (socket) {
      socket.emit('group_message', {
        groupId,
        vendorId,
        message,
        vendorName
      });
    }
  };

  const sendQuickMessage = (groupId: string, vendorId: string, messageType: string, vendorName: string) => {
    if (socket) {
      socket.emit('quick_message', {
        groupId,
        vendorId,
        messageType,
        vendorName
      });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
    sendGroupMessage,
    sendQuickMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 