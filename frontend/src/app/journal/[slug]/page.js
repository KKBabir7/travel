'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Modal, Form, Spinner, Alert, Table } from 'react-bootstrap';
import { FaCalendarAlt, FaPlus, FaMoneyBillWave, FaMapMarkerAlt, FaFileAlt } from 'react-icons/fa';
import MainLayout from '../../../components/MainLayout.js';
import API from '../../../services/api.js';

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;
  const { user: currentUser } = useSelector((state) => state.auth);

  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  // New Log state
  const [logForm, setLogForm] = useState({
    day: 1, title: '', description: '', 
    expenseCategory: 'Food', expenseAmount: '', expenseCurrency: 'USD',
    locationName: ''
  });
  const [submittingLog, setSubmittingLog] = useState(false);

  useEffect(() => {
    fetchJournal();
  }, [slug]);

  const fetchJournal = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await API.get(`/journals/slug/${slug}`);
      setJournal(res.data.journal);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Fallback mockup journal details if no API record is found yet
      setJournal({
        _id: 'mock-journal-detail-1',
        title: 'Summer Solo Backpacking in Italy',
        description: 'Exploring Rome, Florence, Venice, and Milan over 14 days of history, pizzas, and museums.',
        coverImage: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',
        user: { displayName: 'John Doe', username: 'johndoe', profilePicture: '' },
        timeline: [
          {
            _id: 'l1',
            day: 1,
            date: '2026-07-01',
            title: 'Arrival in Rome',
            description: 'Landed at Fiumicino Airport. Checked into a cozy hostel near Termini. Walked to the Colosseum at sunset, and it looked spectacular!',
            locations: [{ name: 'Colosseum, Rome' }],
            expenses: [{ category: 'Accommodation', amount: 45, currency: 'USD' }, { category: 'Food', amount: 20, currency: 'USD' }]
          },
          {
            _id: 'l2',
            day: 2,
            date: '2026-07-02',
            title: 'Vatican City & St. Peter\'s Basilica',
            description: 'Woke up early to beat the crowds at the Vatican Museums. Saw the Sistine Chapel. Climb to the top of St. Peter\'s dome was exhausting but worth it.',
            locations: [{ name: 'Vatican Museums' }],
            expenses: [{ category: 'Entry Ticket', amount: 30, currency: 'USD' }, { category: 'Food', amount: 25, currency: 'USD' }]
          }
        ]
      });
      setLoading(false);
    }
  };

  const handleAddLogSubmit = async (e) => {
    e.preventDefault();
    setSubmittingLog(true);

    const expenses = [];
    if (logForm.expenseAmount) {
      expenses.push({
        category: logForm.expenseCategory,
        amount: parseFloat(logForm.expenseAmount),
        currency: logForm.expenseCurrency
      });
    }

    const locations = [];
    if (logForm.locationName) {
      locations.push({ name: logForm.locationName });
    }

    const logPayload = {
      day: parseInt(logForm.day),
      title: logForm.title,
      description: logForm.description,
      locations,
      expenses
    };

    try {
      if (journal._id.startsWith('mock-')) {
        // Mock update
        const updatedTimeline = [...journal.timeline, {
          _id: Date.now().toString(),
          ...logPayload
        }].sort((a, b) => a.day - b.day);
        setJournal({ ...journal, timeline: updatedTimeline });
      } else {
        const res = await API.post(`/journals/${journal._id}/log`, logPayload);
        setJournal(res.data.journal);
      }
      
      // Reset
      setShowAddLogModal(false);
      setLogForm({
        day: journal.timeline.length + 2,
        title: '',
        description: '',
        expenseCategory: 'Food',
        expenseAmount: '',
        expenseCurrency: 'USD',
        locationName: ''
      });
      setSubmittingLog(false);
    } catch (err) {
      console.error(err);
      setSubmittingLog(false);
      alert('Failed to add day log.');
    }
  };

  if (loading) {
    return <MainLayout><div className="text-center py-5"><Spinner animation="border" variant="info" /></div></MainLayout>;
  }

  if (error || !journal) {
    return <MainLayout><Alert variant="danger" className="text-center">{error || 'Journal not found'}</Alert></MainLayout>;
  }

  const isAuthor = currentUser?.username === journal.user?.username;

  // Calculate total expenses
  const allExpenses = journal.timeline.flatMap(log => log.expenses || []);
  const totalCost = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <MainLayout>
      {/* Cover Card Banner */}
      <Card className="border-secondary text-white mb-4 overflow-hidden position-relative" style={{ height: '300px' }}>
        <div className="w-100 h-100 position-absolute" style={{
          backgroundImage: `url(${journal.coverImage || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6)'
        }} />
        <Card.Body className="position-relative h-100 d-flex flex-column justify-content-end p-4" style={{ zIndex: 2 }}>
          <div className="fw-bold small text-info mb-1 uppercase tracking-widest">Travel Journal</div>
          <h1 className="fw-bold font-heading mb-2">{journal.title}</h1>
          <p className="text-light m-0 line-clamp-2">{journal.description}</p>
          <div className="d-flex align-items-center gap-2 mt-3 text-secondary small">
            <span>By @{journal.user?.username}</span>
            <span>•</span>
            <span>{journal.timeline.length} Days logged</span>
            <span>•</span>
            <span className="text-warning fw-bold">${totalCost.toFixed(2)} total expense</span>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-4">
        {/* Timeline Logs */}
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold font-heading text-white m-0"><FaCalendarAlt className="me-2 text-info" /> Trip Timeline</h3>
            {isAuthor && (
              <Button onClick={() => {
                setLogForm({ ...logForm, day: journal.timeline.length + 1 });
                setShowAddLogModal(true);
              }} className="btn-gradient btn-sm d-flex align-items-center gap-1">
                <FaPlus /> Add Day Log
              </Button>
            )}
          </div>

          {journal.timeline.length === 0 ? (
            <Alert variant="dark" className="border-secondary text-center text-white">No day logs added yet.</Alert>
          ) : (
            <div className="d-flex flex-column gap-4">
              {journal.timeline.map((log) => {
                const dayCost = log.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
                return (
                  <Card key={log._id} className="glass-card border-secondary text-white">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-info p-2 fs-6">Day {log.day}</span>
                          {log.date && <span className="small text-secondary">{new Date(log.date).toLocaleDateString()}</span>}
                        </div>
                        {dayCost > 0 && <span className="small text-warning fw-bold"><FaMoneyBillWave className="me-1" /> ${dayCost.toFixed(2)} spent</span>}
                      </div>

                      <h4 className="fw-bold mb-2 font-heading">{log.title}</h4>
                      <p className="text-light mb-3">{log.description}</p>

                      <div className="d-flex flex-wrap gap-4 pt-2 border-top border-secondary small text-secondary">
                        {log.locations?.map((loc, idx) => (
                          <span key={idx}><FaMapMarkerAlt className="text-danger me-1" /> {loc.name}</span>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Col>

        {/* Expenses and budget summaries */}
        <Col lg={4}>
          <Card className="glass-card border-secondary text-white p-3 mb-4">
            <Card.Title className="fw-bold small text-secondary uppercase mb-3">Budget Summary</Card.Title>
            <div className="text-center py-3">
              <h2 className="fw-bold text-warning font-heading">${totalCost.toFixed(2)}</h2>
              <span className="small text-secondary">Total Logged Expenditures</span>
            </div>

            <hr className="border-secondary mt-0 mb-3" />

            <Table borderless size="sm" className="text-white small m-0">
              <thead>
                <tr className="text-secondary">
                  <th>Category</th>
                  <th className="text-end">Cost</th>
                </tr>
              </thead>
              <tbody>
                {/* Calculate by category */}
                {['Food', 'Accommodation', 'Transport', 'Entertainment', 'Entry Ticket', 'Shopping', 'Others'].map(cat => {
                  const amount = allExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
                  if (amount === 0) return null;
                  return (
                    <tr key={cat}>
                      <td>{cat}</td>
                      <td className="text-end fw-bold">${amount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </Col>
      </Row>

      {/* Add Day Log Modal */}
      <Modal show={showAddLogModal} onHide={() => setShowAddLogModal(false)} size="lg">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title className="font-heading">Log Day Itinerary</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddLogSubmit}>
          <Modal.Body className="text-white">
            <Row className="g-3 mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Day Number</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    value={logForm.day}
                    onChange={(e) => setLogForm({ ...logForm, day: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={9}>
                <Form.Group>
                  <Form.Label>Log Title</Form.Label>
                  <Form.Control
                    type="text"
                    required
                    placeholder="e.g. Exploring Venice Canals"
                    value={logForm.title}
                    onChange={(e) => setLogForm({ ...logForm, title: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Day Log Diary / Experience</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                placeholder="What did you see? How did you feel?"
                value={logForm.description}
                onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location Geotag</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Venice, Italy"
                value={logForm.locationName}
                onChange={(e) => setLogForm({ ...logForm, locationName: e.target.value })}
              />
            </Form.Group>

            <hr className="border-secondary my-4" />
            <h5 className="fw-bold font-heading mb-3"><FaMoneyBillWave className="me-2 text-warning" /> Day Expense Log (Optional)</h5>

            <Row className="g-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={logForm.expenseCategory}
                    onChange={(e) => setLogForm({ ...logForm, expenseCategory: e.target.value })}
                  >
                    <option value="Food">Food & Drink</option>
                    <option value="Accommodation">Accommodation</option>
                    <option value="Transport">Transport</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Entry Ticket">Entry Tickets / Tours</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Others">Others</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label>Amount spent</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    placeholder="Amount"
                    value={logForm.expenseAmount}
                    onChange={(e) => setLogForm({ ...logForm, expenseAmount: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Currency</Form.Label>
                  <Form.Select
                    value={logForm.expenseCurrency}
                    onChange={(e) => setLogForm({ ...logForm, expenseCurrency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="BDT">BDT (৳)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAddLogModal(false)}>Cancel</Button>
            <Button type="submit" disabled={submittingLog} className="btn-gradient">
              {submittingLog ? 'Logging...' : 'Save Log'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </MainLayout>
  );
}
