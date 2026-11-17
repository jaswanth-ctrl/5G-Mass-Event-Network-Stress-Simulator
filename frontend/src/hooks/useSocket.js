import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const URL = 'http://localhost:4000';

export const useSocket = (onEventCb) => {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io(URL);

    // List of events we care about
    const events = [
      'metrics:update',
      'incident:triggered',
      'v2x:broadcast',
      'slice:changed',
      'log:entry',
      'vehicle:update',
      'network:status'
    ];

    events.forEach(eventName => {
      socket.current.on(eventName, (data) => {
        onEventCb(eventName, data);
      });
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, [onEventCb]);

  return socket.current;
};
