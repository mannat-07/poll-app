import { useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function CreatePoll() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setError("");
    setLink("");

    // Frontend validation
    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    if (question.length > 200) {
      setError("Question must be 200 characters or less");
      return;
    }

    // Filter out empty options and validate
    const validOptions = options.filter(o => o.trim() !== "");

    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    // Check for duplicate options
    const uniqueOptions = [...new Set(validOptions.map(o => o.trim().toLowerCase()))];
    if (uniqueOptions.length !== validOptions.length) {
      setError("Options must be unique");
      return;
    }

    // Check option length
    for (let i = 0; i < validOptions.length; i++) {
      if (validOptions[i].length > 100) {
        setError(`Option ${i + 1} must be 100 characters or less`);
        return;
      }
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/polls`, {
        question: question.trim(),
        options: validOptions.map(o => o.trim())
      });

      const pollLink = `${window.location.origin}/poll/${res.data.pollId}`;
      setLink(pollLink);

      // Reset form
      setQuestion("");
      setOptions(["", ""]);

    } catch (err) {
      setError(err.response?.data?.error || "Failed to create poll");
    } finally {
      setLoading(false);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length >= 10) {
      setError("Maximum 10 options allowed");
      return;
    }
    setOptions([...options, ""]);
  };

  const removeOption = (index) => {
    if (options.length <= 2) {
      setError("At least 2 options are required");
      return;
    }
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="container">
      <div className="poll-card">
        <h1>Create a New Poll</h1>
        <p className="subtitle">Create a poll and share the link with others to vote in real-time</p>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Question *</label>
          <input
            className="input-field"
            placeholder="What's your poll question?"
            value={question}
            onChange={e => setError("") || setQuestion(e.target.value)}
            maxLength="200"
          />
          <small>{question.length}/200 characters</small>
        </div>

        <div className="form-group">
          <label>Options *</label>
          {options.map((opt, i) => (
            <div key={i} className="option-input-group">
              <input
                className="input-field"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={e => setError("") || updateOption(i, e.target.value)}
                maxLength="100"
              />
              {options.length > 2 && (
                <button 
                  className="btn-remove" 
                  onClick={() => removeOption(i)}
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <button 
          className="btn-secondary" 
          onClick={addOption}
          disabled={options.length >= 10}
        >
          + Add Option
        </button>

        <button 
          className="btn-primary" 
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Poll"}
        </button>

        {link && (
          <div className="success-box">
            <h3>Poll Created Successfully! 🎉</h3>
            <p>Share this link with others:</p>
            <div className="link-box">
              <input 
                className="link-input" 
                value={link} 
                readOnly 
              />
              <button className="btn-copy" onClick={copyToClipboard}>
                Copy
              </button>
            </div>
            <a href={link} className="btn-visit" target="_blank" rel="noopener noreferrer">
              Visit Poll
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreatePoll;
