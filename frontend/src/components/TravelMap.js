'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { FaTrash, FaPlus, FaRoute } from 'react-icons/fa';

// Fix Leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom map click handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    },
  });
  return null;
}

export default function TravelMap() {
  const [pins, setPins] = useState([
    { id: 1, lat: 23.8103, lng: 90.4125, name: 'Dhaka, Bangladesh', type: 'Visited' },
    { id: 2, lat: 27.7172, lng: 85.3240, name: 'Kathmandu, Nepal', type: 'Visited' },
    { id: 3, lat: 13.7563, lng: 100.5018, name: 'Bangkok, Thailand', type: 'Visited' }
  ]);
  
  const [newPin, setNewPin] = useState({ name: '', lat: '', lng: '', type: 'Visited' });
  const [showRoute, setShowRoute] = useState(true);

  const handleMapClick = (lat, lng) => {
    setNewPin({
      ...newPin,
      lat: lat.toFixed(4),
      lng: lng.toFixed(4),
      name: `Waypoint (${lat.toFixed(2)}, ${lng.toFixed(2)})`
    });
  };

  const handleAddPinSubmit = (e) => {
    e.preventDefault();
    if (!newPin.name || !newPin.lat || !newPin.lng) return;

    const pin = {
      id: Date.now(),
      lat: parseFloat(newPin.lat),
      lng: parseFloat(newPin.lng),
      name: newPin.name,
      type: newPin.type
    };

    setPins([...pins, pin]);
    setNewPin({ name: '', lat: '', lng: '', type: 'Visited' });
  };

  const deletePin = (id) => {
    setPins(pins.filter(p => p.id !== id));
  };

  // Compile route coordinate paths
  const routePositions = pins.map(p => [p.lat, p.lng]);

  return (
    <Card className="glass-panel border-secondary text-white p-3">
      <Row className="g-4">
        {/* Map Control Sidebar */}
        <Col md={4}>
          <h4 className="fw-bold text-gradient font-heading mb-3"><FaRoute className="me-2" /> Route Maker</h4>
          <p className="text-secondary small">Click anywhere directly on the map to extract coordinates and drop a pin, or fill the form below.</p>

          <Form onSubmit={handleAddPinSubmit} className="mb-4">
            <Form.Group className="mb-2">
              <Form.Label className="small text-secondary m-0">Place Name</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="e.g. Rome, Italy"
                value={newPin.name}
                onChange={(e) => setNewPin({ ...newPin, name: e.target.value })}
              />
            </Form.Group>

            <Row className="g-2 mb-2">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-secondary m-0">Latitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 41.90"
                    value={newPin.lat}
                    onChange={(e) => setNewPin({ ...newPin, lat: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label className="small text-secondary m-0">Longitude</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 12.49"
                    value={newPin.lng}
                    onChange={(e) => setNewPin({ ...newPin, lng: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary m-0">Pin Type</Form.Label>
              <Form.Select
                value={newPin.type}
                onChange={(e) => setNewPin({ ...newPin, type: e.target.value })}
              >
                <option value="Visited">Visited Location</option>
                <option value="Route Stop">Route Stop Waypoint</option>
              </Form.Select>
            </Form.Group>

            <Button type="submit" className="btn-gradient w-100 py-2 d-flex align-items-center justify-content-center gap-2">
              <FaPlus /> Drop Marker
            </Button>
          </Form>

          {/* Markers List */}
          <div className="border-top border-secondary pt-3">
            <div className="d-flex justify-content-between mb-2 small text-secondary fw-bold">
              <span>WAYPOINTS ({pins.length})</span>
              <Form.Check
                type="switch"
                id="toggle-route"
                label="Draw Paths"
                checked={showRoute}
                onChange={(e) => setShowRoute(e.target.checked)}
              />
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="d-flex flex-column gap-2 pe-1">
              {pins.map((p, index) => (
                <div key={p.id} className="d-flex align-items-center justify-content-between p-2 rounded bg-tertiary border border-secondary small">
                  <div>
                    <div className="fw-bold">{index + 1}. {p.name}</div>
                    <div className="text-secondary small">{p.lat}, {p.lng} ({p.type})</div>
                  </div>
                  <Button variant="link" className="text-danger p-0" onClick={() => deletePin(p.id)}><FaTrash /></Button>
                </div>
              ))}
            </div>
          </div>
        </Col>

        {/* Leaflet Canvas */}
        <Col md={8}>
          <div className="rounded-3 overflow-hidden border border-secondary" style={{ height: '550px', zIndex: 1 }}>
            <MapContainer 
              center={[23.8103, 90.4125]} 
              zoom={4} 
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapClickHandler onMapClick={handleMapClick} />

              {pins.map((p, index) => (
                <Marker key={p.id} position={[p.lat, p.lng]}>
                  <Popup>
                    <div className="text-dark fw-bold">
                      #{index + 1} {p.name}
                      <div className="text-muted small font-normal">{p.type}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {showRoute && routePositions.length > 1 && (
                <Polyline positions={routePositions} color="#0ea5e9" weight={4} dashArray="5, 10" />
              )}
            </MapContainer>
          </div>
        </Col>
      </Row>
    </Card>
  );
}
