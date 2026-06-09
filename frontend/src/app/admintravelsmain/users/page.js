'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Form } from 'react-bootstrap';
import API from '../../../services/api.js';

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/users');
      setUsers(res.data.users);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback dummy users
      setUsers([
        { _id: 'u1', displayName: 'John Doe', username: 'johndoe', email: 'john@example.com', roles: ['User', 'Admin'], isVerified: true },
        { _id: 'u2', displayName: 'Jane Smith', username: 'janesmith', email: 'jane@example.com', roles: ['User'], isVerified: false }
      ]);
      setLoading(false);
    }
  };

  const toggleVerify = async (userId) => {
    try {
      const res = await API.put(`/admin/users/${userId}/verify`);
      setUsers(users.map(u => u._id === userId ? { ...u, isVerified: res.data.user.isVerified, roles: res.data.user.roles } : u));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId, selectedRole) => {
    const rolesArray = selectedRole === 'Admin' ? ['User', 'Admin'] : ['User'];
    try {
      const res = await API.put(`/admin/users/${userId}/role`, { roles: rolesArray });
      setUsers(users.map(u => u._id === userId ? { ...u, roles: res.data.user.roles } : u));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="info" /></div>;
  }

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover variant="dark" responsive className="border-secondary mt-2 small">
        <thead>
          <tr className="text-secondary">
            <th>Display Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Verification</th>
            <th>Role Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td>{user.displayName}</td>
              <td>@{user.username}</td>
              <td>{user.email}</td>
              <td>{user.roles.join(', ')}</td>
              <td>
                <Button 
                  variant={user.isVerified ? "success" : "outline-warning"} 
                  size="sm"
                  onClick={() => toggleVerify(user._id)}
                >
                  {user.isVerified ? 'Verified' : 'Verify'}
                </Button>
              </td>
              <td>
                <Form.Select 
                  size="sm" 
                  value={user.roles.includes('Admin') ? 'Admin' : 'User'}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                  className="bg-secondary text-white border-0"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </Form.Select>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
