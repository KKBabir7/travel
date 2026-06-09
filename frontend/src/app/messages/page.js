'use client';

import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Container, Row, Col, Card, Form, Button, ListGroup, InputGroup, Spinner } from 'react-bootstrap';
import { FaPaperPlane, FaImage, FaSmile, FaCircle, FaUsers } from 'react-icons/fa';
import MainLayout, { getSocket } from '../../components/MainLayout.js';
import API from '../../services/api.js';
import { setChats, setActiveChat, setMessages, addMessage, setTyping, clearTyping } from '../../redux/chatSlice.js';

export default function MessengerPage() {
  const dispatch = useDispatch();
  const { chats, activeChat, messages, typingStatus } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  
  const messagesEndRef = useRef(null);

  // Connect sockets and listen
  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen to real-time incoming messages
    socket.on('message_received', (msg) => {
      dispatch(addMessage(msg));
      scrollToBottom();
      
      // Emit message seen
      if (activeChat && currentUser) {
        socket.emit('message_seen', { roomId: `user:${currentUser.id}`, messageId: msg._id });
      }
    });

    // Listen to typing status
    socket.on('typing_status', (data) => {
      dispatch(setTyping(data));
    });

    return () => {
      socket.off('message_received');
      socket.off('typing_status');
    };
  }, [activeChat, currentUser, dispatch]);

  useEffect(() => {
    if (activeChat) {
      fetchChatHistory(activeChat);
    }
  }, [activeChat]);

  const fetchThreads = async () => {
    try {
      setLoadingThreads(true);
      const res = await API.get('/messages');
      dispatch(setChats(res.data.chats));
      setLoadingThreads(false);
    } catch (err) {
      console.error(err);
      // Fallback mockup threads for premium UI preview
      dispatch(setChats([
        { type: 'direct', id: 'mock-u1', name: 'Swiss Wanderer', username: 'swiss_wand', profilePicture: '', latestMessage: { content: 'Did you check my new Swiss Alps journal yet?', createdAt: new Date() } },
        { type: 'direct', id: 'mock-u2', name: 'Aqua Explorer', username: 'aqua_exp', profilePicture: '', latestMessage: { content: 'Let\'s go diving next week!', createdAt: new Date() } }
      ]));
      setLoadingThreads(false);
    }
  };

  const fetchChatHistory = async (chat) => {
    setLoadingHistory(true);
    const socket = getSocket();
    if (socket) {
      socket.emit('join_room', chat.type === 'group' ? `group:${chat.id}` : `user:${chat.id}`);
    }

    try {
      const res = await API.get(`/messages/history/${chat.id}`);
      dispatch(setMessages(res.data.messages));
      setLoadingHistory(false);
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error(err);
      // Fallback chat history
      dispatch(setMessages([
        { _id: 'm1', sender: { _id: chat.id, displayName: chat.name }, content: 'Hey there! How is your trip planning going?' },
        { _id: 'm2', sender: { _id: currentUser?.id || 'me', displayName: currentUser?.displayName || 'Me' }, content: 'Hey! It is going great, thinking of Italy next!' }
      ]));
      setLoadingHistory(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeChat) return;

    const payload = {
      recipientId: activeChat.type === 'direct' ? activeChat.id : undefined,
      groupChatId: activeChat.type === 'group' ? activeChat.id : undefined,
      content: typedMessage
    };

    try {
      if (activeChat.id.startsWith('mock-')) {
        // Mock add
        const mockMsg = {
          _id: Date.now().toString(),
          sender: { _id: currentUser?.id || 'me', displayName: currentUser?.displayName || 'Me' },
          content: typedMessage,
          createdAt: new Date()
        };
        dispatch(addMessage(mockMsg));
        setTypedMessage('');
        setTimeout(scrollToBottom, 50);
        return;
      }

      const res = await API.post('/messages', payload);
      dispatch(addMessage(res.data.message));
      setTypedMessage('');
      setTimeout(scrollToBottom, 50);
      
      // Stop typing indicator
      const socket = getSocket();
      if (socket) {
        socket.emit('typing', { roomId: `user:${activeChat.id}`, isTyping: false });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTyping = (e) => {
    setTypedMessage(e.target.value);
    const socket = getSocket();
    if (socket && activeChat) {
      socket.emit('typing', { 
        roomId: activeChat.type === 'group' ? `group:${activeChat.id}` : `user:${activeChat.id}`, 
        isTyping: e.target.value.length > 0 
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isTyping = activeChat && typingStatus[activeChat.id];

  return (
    <MainLayout>
      <Card className="glass-panel border-secondary text-white overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <Row className="g-0 h-100">
          {/* Threads Column */}
          <Col md={4} className="border-end border-secondary h-100 d-flex flex-column">
            <div className="p-3 border-bottom border-secondary">
              <h4 className="fw-bold m-0 font-heading">Messenger</h4>
            </div>

            {loadingThreads ? (
              <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>
            ) : (
              <ListGroup variant="flush" className="bg-transparent flex-grow-1 overflow-y-auto">
                {chats.map((chat) => (
                  <ListGroup.Item
                    key={chat.id}
                    className={`bg-transparent text-white border-secondary d-flex gap-3 align-items-center py-3 px-3 ${activeChat?.id === chat.id ? 'bg-secondary bg-opacity-25' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => dispatch(setActiveChat(chat))}
                  >
                    <img
                      src={chat.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                      alt={chat.name}
                      className="rounded-circle border border-secondary"
                      width="45"
                      height="45"
                      style={{ objectFit: 'cover' }}
                    />
                    <div className="w-100 overflow-hidden">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-bold small">{chat.name}</span>
                        <span className="text-secondary small" style={{ fontSize: '10px' }}>
                          {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-secondary small m-0 text-truncate">{chat.latestMessage?.content || 'Started a conversation'}</p>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>

          {/* Active Chat Conversation Column */}
          <Col md={8} className="h-100 d-flex flex-column justify-content-between bg-black bg-opacity-20">
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-bottom border-secondary d-flex align-items-center justify-content-between bg-dark bg-opacity-50">
                  <div className="d-flex align-items-center gap-2">
                    <img
                      src={activeChat.profilePicture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'}
                      alt={activeChat.name}
                      className="rounded-circle border"
                      width="40"
                      height="40"
                    />
                    <div>
                      <div className="fw-bold font-heading">{activeChat.name}</div>
                      <div className="text-info small d-flex align-items-center gap-1">
                        {isTyping ? (
                          <span className="text-secondary italic">typing...</span>
                        ) : (
                          <><FaCircle size={8} /> Active now</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message Log */}
                <div className="flex-grow-1 overflow-y-auto p-4 d-flex flex-column gap-3">
                  {loadingHistory ? (
                    <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = currentUser && msg.sender?._id === currentUser.id;
                      return (
                        <div key={msg._id} className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
                          <div className={`p-3 rounded-4 max-w-75 ${isOwn ? 'bg-primary text-white' : 'bg-secondary text-white'}`} style={{
                            borderTopRightRadius: isOwn ? '0' : '16px',
                            borderTopLeftRadius: isOwn ? '16px' : '0',
                            maxWidth: '75%'
                          }}>
                            {!isOwn && <div className="small text-info fw-bold mb-1">@{msg.sender?.username || 'user'}</div>}
                            <p className="m-0 small">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input bar */}
                <div className="p-3 border-top border-secondary bg-dark bg-opacity-30">
                  <Form onSubmit={handleSendMessage}>
                    <InputGroup>
                      <Button variant="outline-secondary" className="border-0 text-muted"><FaImage /></Button>
                      <Button variant="outline-secondary" className="border-0 text-muted"><FaSmile /></Button>
                      <Form.Control
                        type="text"
                        placeholder="Write your message here..."
                        className="bg-transparent border-0 text-white shadow-none"
                        value={typedMessage}
                        onChange={handleTyping}
                      />
                      <Button type="submit" className="btn-gradient border-0 px-4 d-flex align-items-center gap-2"><FaPaperPlane /> Send</Button>
                    </InputGroup>
                  </Form>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-secondary">
                <span className="fs-1 mb-2">💬</span>
                <h4 className="fw-bold font-heading">Your Chatroom is Waiting</h4>
                <p className="small">Select a conversation thread from the sidebar to start mapping travel logs.</p>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </MainLayout>
  );
}
