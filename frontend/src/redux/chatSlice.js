import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  activeChat: null, // { type: 'direct'|'group', id: String, name: String, ... }
  messages: [],
  loading: false,
  typingStatus: {} // { userId: Boolean }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats(state, action) {
      state.chats = action.payload;
    },
    setActiveChat(state, action) {
      state.activeChat = action.payload;
      state.messages = []; // Clear old messages
    },
    setMessages(state, action) {
      state.messages = action.payload;
    },
    addMessage(state, action) {
      // Append if it belongs to the active chat thread
      const msg = action.payload;
      const active = state.activeChat;

      if (active) {
        const isCurrentGroup = active.type === 'group' && msg.groupChat?._id === active.id;
        const isCurrentDirect = active.type === 'direct' && 
          ((msg.sender?._id === active.id && !msg.groupChat) || (msg.recipient?._id === active.id && !msg.groupChat));

        if (isCurrentGroup || isCurrentDirect) {
          state.messages.push(msg);
        }
      }

      // Update the chats list (update latest message for that chat)
      const chatIndex = state.chats.findIndex(c => {
        if (msg.groupChat) {
          return c.type === 'group' && c.id === msg.groupChat._id;
        } else {
          const partnerId = msg.sender?._id === active?.id ? msg.recipient?._id : msg.sender?._id;
          return c.type === 'direct' && c.id === partnerId;
        }
      });

      if (chatIndex !== -1) {
        state.chats[chatIndex].latestMessage = msg;
        // Sort conversations to bring latest to top
        state.chats.sort((a, b) => new Date(b.latestMessage?.createdAt) - new Date(a.latestMessage?.createdAt));
      }
    },
    setTyping(state, action) {
      const { userId, isTyping } = action.payload;
      state.typingStatus[userId] = isTyping;
    },
    clearTyping(state) {
      state.typingStatus = {};
    }
  }
});

export const { setChats, setActiveChat, setMessages, addMessage, setTyping, clearTyping } = chatSlice.actions;
export default chatSlice.reducer;
