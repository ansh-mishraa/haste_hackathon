import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

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
    socketInstance.on('notification', (data) => {
      toast.success(data.message || 'New notification');
    });

    socketInstance.on('new_group_formed', (data) => {
      toast.info(`New group formed near ${data.pickupLocation}`);
    });

    socketInstance.on('group_ready_for_bids', (data) => {
      toast.info(`Group order ready for bids - Total: ₹${data.totalValue}`);
    });

    socketInstance.on('bid_accepted', (data) => {
      toast.success(`Your bid was accepted by ${data.supplierName}!`);
    });

    socketInstance.on('new_bid_received', (data) => {
      toast.info(`New bid received from ${data.supplierName}`);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}; 