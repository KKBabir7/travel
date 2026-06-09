'use client';

import { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert } from 'react-bootstrap';
import API from '../../../services/api.js';

export default function AdminReportsManagement() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/reports');
      setReports(res.data.reports);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback mockup reports
      setReports([
        { _id: 'r1', reporter: { displayName: 'Fahmida' }, contentId: 'post-xyz', contentType: 'Post', reason: 'Spam advertising link', status: 'pending' },
        { _id: 'r2', reporter: { displayName: 'David' }, contentId: 'comment-abc', contentType: 'Comment', reason: 'Harassment in replies', status: 'pending' }
      ]);
      setLoading(false);
    }
  };

  const handleDismiss = async (reportId) => {
    try {
      await API.put(`/admin/reports/${reportId}`, { status: 'dismissed' });
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteContent = async (reportId, contentType, contentId) => {
    try {
      await API.delete('/admin/content', { data: { contentType, contentId } });
      setReports(reports.filter(r => r._id !== reportId));
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
            <th>Reporter</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report._id}>
              <td>{report.reporter?.displayName || 'System'}</td>
              <td>{report.contentType}</td>
              <td>{report.reason}</td>
              <td><span className="badge bg-warning">{report.status}</span></td>
              <td>
                <div className="d-flex gap-2">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => handleDismiss(report._id)}
                  >
                    Dismiss
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleDeleteContent(report._id, report.contentType, report.contentId)}
                  >
                    Delete Content
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
