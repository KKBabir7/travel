import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
    },
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead(state, action) {
      const notifId = action.payload;
      const notif = state.notifications.find(n => n._id === notifId);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllRead(state) {
      state.notifications.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    }
  }
});

export const { setNotifications, addNotification, markRead, markAllRead } = notificationSlice.actions;
export default notificationSlice.reducer;
