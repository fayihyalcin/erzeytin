import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from './api';

export function createAdminSocket(token: string): Socket {
  return io(`${API_ORIGIN}/admin-live`, {
    transports: ['websocket'],
    auth: {
      token,
    },
  });
}

