import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

function Dashboard({ token, onLogout }) {
  const [view, setView] = useState('list');
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollPassword, setPollPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [newPollPassword, setNewPollPassword] = useState('');
  const [options, setOptions] = useState(['', '']);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await fetch(`${API_URL}/polls`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        console.error('Failed to fetch polls:', res.status);
        setPolls([]);
        return;
      }
      const data = await res.json();
      setPolls(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setPolls([]);
    }
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.trim());
    
    if (validOptions.length < 2) {
      alert('At least 2 options required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          isPublic,
          pollPassword: isPublic ? null : newPollPassword,
          options: validOptions
        })
      });

      if (res.ok) {
        alert('Poll created successfully!');
        setTitle('');
        setDescription('');
        setOptions(['', '']);
        setNewPollPassword('');
        fetchPolls();
        setView('list');
      } else {
        alert('Failed to create poll');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewPoll = async (pollId) => {
    try {
      const res = await fetch(`${API_URL}/polls/${pollId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.requiresPassword) {
        setSelectedPoll({ id: pollId, requiresPassword: true });
        setPasswordVerified(false);
        setView('vote');
      } else {
        setSelectedPoll(data);
        setPasswordVerified(true);
        setView('vote');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/polls/${selectedPoll.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password: pollPassword })
      });

      if (res.ok) {
        const pollRes = await fetch(`${API_URL}/polls/${selectedPoll.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await pollRes.json();
        setSelectedPoll(data);
        setPasswordVerified(true);
        setPollPassword('');
      } else {
        alert('Invalid password');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVote = async (optionId) => {
    try {
      const res = await fetch(`${API_URL}/polls/${selectedPoll.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          optionId,
          password: !selectedPoll.is_public ? pollPassword : null
        })
      });

      if (res.ok) {
        alert('Vote recorded!');
        handleViewPoll(selectedPoll.id);
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm('Delete this poll?')) return;

    try {
      const res = await fetch(`${API_URL}/polls/${pollId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        alert('Poll deleted');
        fetchPolls();
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));
  const updateOption = (idx, value) => {
    const newOpts = [...options];
    newOpts[idx] = value;
    setOptions(newOpts);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>VoteX Dashboard</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <nav className="dashboard-nav">
        <button onClick={() => setView('list')} className={view === 'list' ? 'active' : ''}>
          All Polls
        </button>
        <button onClick={() => setView('create')} className={view === 'create' ? 'active' : ''}>
          Create Poll
        </button>
      </nav>

      {view === 'list' && (
        <div className="polls-list">
          <h2>Available Polls</h2>
          {polls.length === 0 && <p>No polls yet. Create one!</p>}
          {polls.map(poll => (
            <div key={poll.id} className="poll-card">
              <h3>{poll.title}</h3>
              <p>{poll.description}</p>
              <div className="poll-meta">
                <span>{poll.is_public ? '🌐 Public' : '🔒 Private'}</span>
                <span>👤 {poll.creator_email}</span>
                <span>🗳️ {poll.total_votes} votes</span>
              </div>
              <div className="poll-actions">
                <button onClick={() => handleViewPoll(poll.id)}>View & Vote</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'create' && (
        <div className="create-poll">
          <h2>Create New Poll</h2>
          <form onSubmit={handleCreatePoll}>
            <input
              type="text"
              placeholder="Poll Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Public Poll
            </label>

            {!isPublic && (
              <input
                type="password"
                placeholder="Poll Password"
                value={newPollPassword}
                onChange={(e) => setNewPollPassword(e.target.value)}
                required
              />
            )}

            <h3>Options</h3>
            {options.map((opt, idx) => (
              <div key={idx} className="option-input">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(idx)}>❌</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOption} className="add-option-btn">+ Add Option</button>

            <button type="submit" className="submit-btn">Create Poll</button>
          </form>
        </div>
      )}

      {view === 'vote' && selectedPoll && (
        <div className="vote-view">
          {!passwordVerified && selectedPoll.requiresPassword ? (
            <form onSubmit={handleVerifyPassword} className="password-form">
              <h2>🔒 Private Poll</h2>
              <p>This poll requires a password</p>
              <input
                type="password"
                placeholder="Enter poll password"
                value={pollPassword}
                onChange={(e) => setPollPassword(e.target.value)}
                required
              />
              <button type="submit">Unlock</button>
              <button type="button" onClick={() => setView('list')}>Back</button>
            </form>
          ) : (
            <>
              <button onClick={() => setView('list')} className="back-btn">← Back to Polls</button>
              <h2>{selectedPoll.title}</h2>
              <p>{selectedPoll.description}</p>
              
              {selectedPoll.hasVoted ? (
                <div className="results">
                  <h3>Results</h3>
                  {selectedPoll.options.map(opt => {
                    const maxVotes = Math.max(...selectedPoll.options.map(o => o.vote_count), 1);
                    return (
                      <div key={opt.id} className="result-bar">
                        <span className={selectedPoll.userVote === opt.id ? 'your-vote' : ''}>
                          {opt.option_text} {selectedPoll.userVote === opt.id && '✓'}
                        </span>
                        <div className="bar">
                          <div 
                            className="fill" 
                            style={{ width: `${(opt.vote_count / maxVotes) * 100}%` }}
                          />
                        </div>
                        <span>{opt.vote_count} votes</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="vote-options">
                  <h3>Vote for your choice:</h3>
                  {selectedPoll.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleVote(opt.id)}
                      className="vote-option-btn"
                    >
                      {opt.option_text}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
