import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const socket = io(SOCKET_URL);

function PollPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);

  const fetchPoll = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/polls/${id}`);
      setPoll(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || "Poll not found");
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPoll();

    // Join the Socket.IO room for this poll
    socket.emit("join_poll", id);

    // Listen for real-time updates
    socket.on("update", (updatedPoll) => {
      setPoll(updatedPoll);
    });

    // Listen for vote errors
    socket.on("vote_error", (data) => {
      setError(data.error);
      setVoted(true);
    });

    // Check if user already voted (localStorage - Fairness Mechanism #1)
    // This prevents repeat voting from the same browser
    if (localStorage.getItem(`voted_${id}`)) {
      setVoted(true);
    }

    return () => {
      socket.off("update");
      socket.off("vote_error");
    };
  }, [id, fetchPoll]);

  const vote = (index) => {
    if (voted) {
      setError("You have already voted!");
      return;
    }

    // Emit vote to server
    socket.emit("vote", { pollId: id, optionIndex: index });

    // Fairness Mechanism #1: localStorage-based voting prevention
    // This prevents the same browser from voting multiple times
    // Limitation: Can be bypassed by clearing browser storage or using incognito mode
    localStorage.setItem(`voted_${id}`, "true");
    setVoted(true);
    setSelectedOption(index);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="poll-card">
          <div className="loading">Loading poll...</div>
        </div>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="container">
        <div className="poll-card">
          <div className="error-message">{error}</div>
          <button className="btn-primary" onClick={() => navigate("/")}>
            Create a New Poll
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  return (
    <div className="container">
      <div className="poll-card">
        <h1>{poll.question}</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {voted && (
          <div className="info-message">
            ✓ You have voted! Results update in real-time.
          </div>
        )}

        <div className="total-votes">
          Total Votes: <strong>{totalVotes}</strong>
        </div>

        <div className="options-container">
          {poll.options.map((opt, i) => {
            const percent = totalVotes
              ? ((opt.votes / totalVotes) * 100).toFixed(1)
              : 0;

            const isSelected = selectedOption === i;

            return (
              <div key={i} className="option-item">
                <button 
                  onClick={() => vote(i)} 
                  disabled={voted}
                  className={`option-button ${voted ? 'voted' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <span className="option-text">{opt.text}</span>
                  {!voted && <span className="vote-prompt">Click to vote</span>}
                </button>
                
                <div className="vote-stats">
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="vote-info">
                    <span className="vote-count">{opt.votes} votes</span>
                    <span className="vote-percent">{percent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button className="btn-secondary" onClick={() => navigate("/")}>
          Create Your Own Poll
        </button>

        <div className="fairness-info">
          <h4>🔒 Fairness Mechanisms:</h4>
          <ul>
            <li><strong>Browser-Based:</strong> localStorage prevents repeat voting from the same browser (can be bypassed by clearing storage or using incognito mode)</li>
            <li><strong>IP-Based:</strong> Server tracks IP addresses to prevent repeat voting from the same network (more robust but can affect users behind shared IPs)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PollPage;
