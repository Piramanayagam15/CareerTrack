import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'https://careertrack-backend-s94d.onrender.com/api/applications';

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    jobUrl: '',
    notes: '',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch applications from backend
  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setApplications(data);
      setServerOnline(true);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    const interval = setInterval(fetchApplications, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle Form Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create Application (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      showToast('Company and Role are required', 'error');
      return;
    }

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create application');

      const savedData = await res.json();
      setApplications((prev) => [savedData.application || { ...formData, _id: savedData.id, createdAt: new Date() }, ...prev]);
      setIsModalOpen(false);
      setFormData({
        company: '',
        role: '',
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        jobUrl: '',
        notes: '',
      });
      showToast('Application added successfully! 🎉');
    } catch (err) {
      console.error('Error adding application:', err);
      showToast('Failed to add application. Check backend server.', 'error');
    }
  };

  // Update Status (PATCH)
  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      setApplications((prev) =>
        prev.map((app) => (app._id === id ? { ...app, status: newStatus } : app))
      );
      showToast(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  // Delete Application (DELETE)
  const handleDelete = async (id, company) => {
    if (!window.confirm(`Are you sure you want to delete the application for ${company}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete application');

      setApplications((prev) => prev.filter((app) => app._id !== id));
      showToast('Application deleted');
    } catch (err) {
      console.error('Error deleting application:', err);
      showToast('Failed to delete application', 'error');
    }
  };

  // Calculations
  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'Applied').length,
    interview: applications.filter((a) => a.status === 'Interview' || a.status === 'Interviewing').length,
    offer: applications.filter((a) => a.status === 'Offer' || a.status === 'Offered').length,
    rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  // Filter & Search Logic
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.role?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Interview') return matchesSearch && (app.status === 'Interview' || app.status === 'Interviewing');
    if (statusFilter === 'Offer') return matchesSearch && (app.status === 'Offer' || app.status === 'Offered');
    return matchesSearch && app.status === statusFilter;
  });

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">⚡</div>
          <div>
            <h1 className="brand-title">CareerTrack</h1>
            <p className="brand-subtitle">Job Application & Interview Tracker</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="status-indicator">
            <span className={`status-dot ${serverOnline ? '' : 'offline'}`}></span>
            {serverOnline ? 'Backend Connected' : 'Connecting to Server...'}
          </div>

          <button id="add-application-btn" className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Application
          </button>
        </div>
      </header>

      {/* Stats Summary Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon total">📁</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Applied</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon applied">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.applied}</span>
            <span className="stat-label">In Review</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon interview">🎯</div>
          <div className="stat-info">
            <span className="stat-value">{stats.interview}</span>
            <span className="stat-label">Interviews</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon offer">🏆</div>
          <div className="stat-info">
            <span className="stat-value">{stats.offer}</span>
            <span className="stat-label">Offers</span>
          </div>
        </div>
      </section>

      {/* Controls & Filter Bar */}
      <div className="controls-bar">
        <div className="search-box">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search by company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          {['All', 'Applied', 'Interview', 'Offer', 'Rejected'].map((status) => (
            <button
              key={status}
              className={`pill-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Grid / Content */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading applications from MongoDB...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h2 className="empty-title">
            {searchTerm || statusFilter !== 'All' ? 'No matching applications found' : 'No job applications yet'}
          </h2>
          <p className="empty-desc">
            {searchTerm || statusFilter !== 'All'
              ? 'Try adjusting your search or filters to see more results.'
              : 'Start tracking your career journey by adding your first job application.'}
          </p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            + Add First Application
          </button>
        </div>
      ) : (
        <div className="applications-grid">
          {filteredApplications.map((app) => {
            const normalizedStatus =
              app.status === 'Interviewing' ? 'Interview' : app.status === 'Offered' ? 'Offer' : app.status;
            const statusClass = normalizedStatus ? normalizedStatus.toLowerCase() : 'applied';

            return (
              <div key={app._id} className={`app-card status-${statusClass} fade-in`}>
                <div>
                  <div className="card-top">
                    <div className="company-badge">
                      <div className="company-avatar">
                        {app.company ? app.company.charAt(0).toUpperCase() : 'J'}
                      </div>
                      <div>
                        <h3 className="company-name">{app.company}</h3>
                        <p className="job-role">{app.role}</p>
                      </div>
                    </div>

                    <span className={`status-pill ${statusClass}`}>
                      ● {app.status || 'Applied'}
                    </span>
                  </div>

                  <div className="card-details">
                    <div className="detail-row">
                      <span className="detail-icon">📅</span>
                      <span>Applied on {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}</span>
                    </div>

                    {app.notes && (
                      <div className="card-notes">
                        {app.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-footer">
                  <select
                    className="status-select"
                    value={app.status || 'Applied'}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interview">Interview</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>

                  <div className="card-actions-right">
                    {app.jobUrl && (
                      <a
                        href={app.jobUrl.startsWith('http') ? app.jobUrl : `https://${app.jobUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="action-btn"
                        title="Open Job Link"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                          <polyline points="15 3 21 3 21 9"></polyline>
                          <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                      </a>
                    )}

                    <button
                      className="action-btn delete"
                      title="Delete Application"
                      onClick={() => handleDelete(app._id, app.company)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Application Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Track New Application</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input
                    type="text"
                    name="company"
                    className="form-input"
                    placeholder="e.g. Google, Amazon, Zoho"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Role / Title *</label>
                  <input
                    type="text"
                    name="role"
                    className="form-input"
                    placeholder="e.g. Full Stack Developer, Frontend Engineer"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Date Applied</label>
                    <input
                      type="date"
                      name="appliedDate"
                      className="form-input"
                      value={formData.appliedDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Posting URL (Optional)</label>
                  <input
                    type="url"
                    name="jobUrl"
                    className="form-input"
                    placeholder="https://linkedin.com/jobs/view/..."
                    value={formData.jobUrl}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes & Comments (Optional)</label>
                  <textarea
                    name="notes"
                    className="form-textarea"
                    placeholder="Salary expectations, referral details, round 1 date..."
                    value={formData.notes}
                    onChange={handleInputChange}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="toast-container">
          <div className={`toast ${toast.type}`}>
            <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
