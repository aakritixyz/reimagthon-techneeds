"use client";

import { useState, useEffect } from 'react';
import { mentorLogin, addMentee, addResource, getMentorDetails, getProgramMentees, getProgramResources } from '../../lib/api';
import UnverifiedProjects from './projects';
import './mentor.css'

export default function MentorPanel() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [menteeName, setMenteeName] = useState('');
  const [menteeEmail, setMenteeEmail] = useState('');
  const [menteeCredentials, setMenteeCredentials] = useState(null);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceURL, setResourceURL] = useState('');
  const [resourceType, setResourceType] = useState('video');
  const [deadline, setDeadline] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [mentees, setMentees] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [revealScores, setRevealScores] = useState(false);
  const [questions, setQuestions] = useState([]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 1
      }
    ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = value;
    setQuestions(updated);
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedProgram = localStorage.getItem('selectedProgram');
    localStorage.removeItem('mentor');
    if (!savedToken) return;

    getMentorDetails(savedToken).then((mentor) => {
      setToken(savedToken);
      setPrograms(mentor.programs);
      setLoggedIn(true);
      if (mentor.programs.some((program) => program._id === savedProgram)) {
        handleProgramSelect(savedProgram, savedToken);
      }
    }).catch((error) => {
      if (error.status === 401) localStorage.removeItem('token');
    });
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const { token } = await mentorLogin(email, password);
      const mentor = await getMentorDetails(token);
      localStorage.setItem('token', token);
      setToken(token);
      setPrograms(mentor.programs);
      setLoggedIn(true);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken('');
    setLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('selectedProgram');
    setSelectedProgram('');
    setMenteeCredentials(null);
  };

  const handleAddMentee = async () => {
    try {
      const result = await addMentee(token, {
        email: menteeEmail,
        name: menteeName,
        programId: selectedProgram,
      });
      setMenteeCredentials({ enrollmentNumber: result.mentee.enrollmentNumber, password: result.tempPassword });
      setMenteeEmail('');
      setMenteeName('');
      await handleProgramSelect(selectedProgram);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProgramSelect = async (programId, authToken = token) => {
    setSelectedProgram(programId);
    localStorage.setItem('selectedProgram', programId);
    if (!programId) {
      setMentees([]);
      setResources([]);
      return;
    }
    try {
      const [menteesData, resourcesData] = await Promise.all([
        getProgramMentees(programId, authToken),
        getProgramResources(programId, authToken)
      ]);
      setMentees(menteesData);
      setResources(resourcesData);
    } catch (err) {
      console.error('Failed to load program data:', err);
      // Handle error (show toast/message)
    }
  };

  const handleAddResource = async () => {
    try {
      let resourceData = {
        title: resourceTitle,
        type: resourceType,
        program: selectedProgram,
      };
  
      let isQuiz = false;
  
      if (resourceType === 'quiz') {
        isQuiz = true;
        const maxScore = questions.reduce((sum, q) => sum + Number(q.marks || 1), 0);
        resourceData = {
          ...resourceData,
          questions,
          startTime: startTime ? new Date(startTime).toISOString() : undefined,
          endTime: endTime ? new Date(endTime).toISOString() : undefined,
          revealScores,
          maxScore
        };
      } else {
        if (!deadline || maxScore === '' || Number(maxScore) < 0) {
          throw new Error('Set a deadline and a non-negative maximum score.');
        }
        resourceData.url = resourceURL;
        resourceData.deadline = new Date(deadline).toISOString();
        resourceData.maxScore = Number(maxScore);
      }
  
      await addResource(token, resourceData, isQuiz);
      setResourceTitle('');
      await handleProgramSelect(selectedProgram);
      alert('Resource added!');
    } catch (err) {
      alert(err.message);
    }
  };
  
  

  return (
    <>
    <div className="container">
      {!loggedIn ? (
        <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Mentor Login</h1>
          <p className="login-subtitle">Enter your credentials to access mentor dashboard</p>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                  <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                  <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                </svg>
              )}
            </button>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="login-button"
          >
            {isLoading ? (
              <>
                <span className="spinner">↻</span> Logging in...
              </>
            ) : 'Login'}
          </button>
        </div>
      </div>
      ) : (
        <div>
          <button className='logout-button' onClick={handleLogout}>Logout</button>
          <div className="section">
            <h2>Mentor Panel</h2>
  
            <h3>Programs</h3>
            <select value={selectedProgram} onChange={e => handleProgramSelect(e.target.value)}>
              <option value="">Select Program</option>
              {programs.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
  
          <div className="section">
            <h3>Add Mentee</h3>
            <input placeholder="Email" value={menteeEmail} onChange={e => setMenteeEmail(e.target.value)} />
            <input placeholder="Mentee Name" value={menteeName} onChange={e => setMenteeName(e.target.value)} />
            <button onClick={handleAddMentee} disabled={!selectedProgram || !menteeEmail || !menteeName}>Generate mentee credentials</button>
            {menteeCredentials && (
              <div role="status">
                <p>Enrollment number: <code>{menteeCredentials.enrollmentNumber}</code></p>
                <p>Initial password: <code>{menteeCredentials.password}</code></p>
                <button onClick={() => setMenteeCredentials(null)}>Hide credentials</button>
              </div>
            )}
          </div>
  
          <div className="section">
            <h3>Add Resource</h3>
            <input placeholder="Resource Title" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} />
  
            {resourceType !== 'quiz' && (
              <>
                <input type="url" placeholder="Resource URL" value={resourceURL} onChange={e => setResourceURL(e.target.value)} />
                <label>Deadline <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></label>
                <label>Maximum score <input type="number" min="0" value={maxScore} onChange={e => setMaxScore(e.target.value)} /></label>
              </>
            )}
  
            <select onChange={e => setResourceType(e.target.value)} value={resourceType}>
              <option value="video">Video</option>
              <option value="quiz">Quiz</option>
              <option value="project">Project</option>
            </select>
  
            {resourceType === 'quiz' && (
              <div className="quiz-section">
                <label>Start Time:</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <br/>
                <label>End Time:</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
                <label>Reveal Scores:</label>
                <input type="checkbox" checked={revealScores} onChange={e => setRevealScores(e.target.checked)} />
                <h4>Questions</h4>
                {questions.map((q, i) => (
                  <div key={i} className="question-block">
                    <input placeholder="Question Text" value={q.questionText} onChange={e => updateQuestion(i, 'questionText', e.target.value)} />
                    {q.options.map((opt, j) => (
                      <input key={j} placeholder={`Option ${j + 1}`} value={opt} onChange={e => updateOption(i, j, e.target.value)} />
                    ))}
                    <label>Correct Option Index:</label>
                    <input type="number" min="0" max="3" value={q.correctOptionIndex} onChange={e => updateQuestion(i, 'correctOptionIndex', parseInt(e.target.value))} />
                    <label>Marks:</label>
                    <input type="number" value={q.marks} onChange={e => updateQuestion(i, 'marks', parseInt(e.target.value))} />
                  </div>
                ))}
                <button onClick={addQuestion}>+ Add Question</button>
              </div>
            )}
  
            <button onClick={handleAddResource} disabled={!selectedProgram || !resourceTitle.trim()}>Add Resource</button>
          </div>
  
          {selectedProgram && (
            <div className="section">
              <h3>Mentees</h3>
              {mentees.length > 0 ? (
                <table className="responstable">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Enrollment Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentees.map(mentee => (
                      <tr key={mentee._id}>
                        <td>{mentee.name}</td>
                        <td>{mentee.enrollmentNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No mentees in this program</p>}
  
              <h3>Resources</h3>
              {resources.length > 0 ? (
                <table className="responstable">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(resource => (
                      <tr key={resource._id}>
                        <td>{resource.title}</td>
                        <td>{resource.type}</td>
                        <td>{resource.url || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>No resources in this program</p>}
            </div>
          )}
        <UnverifiedProjects />
        </div>
      )}
    </div>
    </>
  );
  
}
