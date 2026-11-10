'use client';

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import QuizAttempt from './QuizAttempt';
import ProjectSubmissionForm from './ProjectSubmission';
import './mentee.css'

export default function MenteeDashboard() {
  const [mentee, setMentee] = useState(null);
  const [activeQuizResource, setActiveQuizResource] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('menteeToken');
      if (!token) return router.push('/mentee');

      try {
        const res = await axios.get(`${API_BASE_URL}/api/m/dashboard`, {
          headers: { 'x-auth-token': token }
        });
        setMentee(res.data);
      } catch (err) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('menteeToken');
        router.push('/mentee');
      }
    };

    fetchDashboard();
  }, []);

  const handleComplete = async (resourceId) => {
    try {
      const token = localStorage.getItem('menteeToken');
      const res = await axios.post(`${API_BASE_URL}/api/m/resources/${resourceId}/complete`, {}, {
        headers: { 'x-auth-token': token }
      });
      alert(res.data.message);
      const updatedMentee = { ...mentee };
      updatedMentee.programs.forEach((program) => {
        program.resources.forEach((resource) => {
          if (resource._id === resourceId) {
            resource.completed = true;
            resource.score = res.data.score;
            resource.completedOn = new Date().toISOString();
          }
        });
      });
      setMentee(updatedMentee);
      // window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Something went wrong.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('menteeToken');
    router.push('/mentee');
  };

  if (!mentee) return (<div className="load-wrapp">
      <div className="load-4">
        <div className="ring-1"></div>
      </div>
    </div>);
  // components/MenteeDashboard.js

  return (
    <div className="mentee-dashboard">
      <button onClick={handleLogout} className="logout-button">Logout</button>
      <div className="mentee-header">
        <h1>Welcome, {mentee.name} 👋</h1>
        <div className="stat-cards">
  <div className="stat-card">
    <h3>Rank</h3>
    <span>🏅 {mentee.rank}</span>
  </div>
  <div className="stat-card">
    <h3>Total Score</h3>
    <span>🏆 {mentee.totalScore}</span>
  </div>
  <div className="stat-card">
    <h3>Streak</h3>
    <span>🔥 {mentee.streak} days</span>
  </div>
</div>

      </div>
  
      {mentee.programs.map(program => (
        <div key={program._id} className="program-card">
          <h2>{program.name}</h2>
  
          {program.resources.length === 0 ? (
            <p>No resources yet!</p>
          ) : (
            <div className="responsive-table-wrapper">
            <table className="responsive-table">
  <thead>
    <tr>
      <th>Title</th>
      <th>Type</th>
      <th>Score</th>
      <th>Status</th>
      <th>Deadline</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {program.resources.map((res) => (
      <tr key={res._id}>
        <td>
          <strong>{res.title}</strong><br />
          <a href={res.url} target="_blank" rel="noopener noreferrer">🔗 View</a>
        </td>
        <td>{res.type}</td>
        <td>{res.maxScore}</td>
        <td>{res.isLocked ? '🔒 Locked' : '✅ Unlocked'}</td>
        <td>{res.deadline}</td>
        <td className="actions">
          {!res.completed && res.type === 'quiz' && !res.isLocked && (
            activeQuizResource === res._id ? (
              <QuizAttempt
                resourceId={res._id}
                onComplete={(score) => {
                  const updated = { ...mentee };
                  updated.programs.forEach((p) =>
                    p.resources.forEach((r) => {
                      if (r._id === res._id) {
                        r.completed = true;
                        r.score = score;
                        r.completedOn = new Date().toISOString();
                      }
                    })
                  );
                  setMentee(updated);
                  setActiveQuizResource(null);
                }}
              />
            ) : (
              <button onClick={() => setActiveQuizResource(res._id)}>Attempt Quiz</button>
            )
          )}

          {!res.completed && res.type === 'project' && !res.isLocked && (
            <ProjectSubmissionForm
              resourceId={res._id}
              onSubmitted={(score) => {
                const updated = { ...mentee };
                updated.programs.forEach((p) =>
                  p.resources.forEach((r) => {
                    if (r._id === res._id) {
                      r.completed = true;
                      r.score = score;
                      r.completedOn = new Date().toISOString();
                    }
                  })
                );
                setMentee(updated);
              }}
            />
          )}

          {res.completed ? (
            <div className="completed-info">
              ✅ Completed <br />
              On: {new Date(res.completedOn).toLocaleDateString()}<br />
              Score: {res.score}
            </div>
          ) : (
            !res.isLocked && (
              <div>
                <input type="checkbox" onChange={() => handleComplete(res._id)} /> Mark as Completed
              </div>
            )
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
          )}
        </div>
      ))}
    </div>
  );
  
}
