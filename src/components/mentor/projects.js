"use client";

import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UnverifiedProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreInput, setScoreInput] = useState('');

  const fetchProjects = async () => {
    try {
        const res = await axios.get(`${API_BASE_URL}/api/unverified-projects`, {
            headers: {
              'x-auth-token': localStorage.getItem('token') // or however you're storing it
            }
          });
      setProjects(res.data.unverifiedProjects);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleVerify = async (menteeId, resourceId, score) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/${menteeId}/resources/${resourceId}/verify`, {
        score
      }, {
        headers: {
          'x-auth-token': localStorage.getItem('mentorToken')
        }
      });
      setProjects(prev => prev.filter(p => !(p.menteeId === menteeId && p.resourceId === resourceId)));
    } catch (err) {
      console.error(err);
    }
  };
  

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  if (projects.length === 0) return <p className="text-center mt-10">No unverified projects 🎉</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Unverified Project Submissions</h2>
      <div className="space-y-6">
        {projects.map((proj, index) => (
          <div key={index} className="border rounded-xl p-4 shadow hover:shadow-lg transition">
            <h3 className="text-lg font-semibold mb-2">{proj.resourceTitle}</h3>
            <p><strong>Mentee:</strong> {proj.menteeName}</p>
            <p><strong>GitHub:</strong> <a href={proj.githubLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{proj.githubLink}</a></p>
            <p><strong>Deployed:</strong> <a href={proj.deployedLink} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{proj.deployedLink}</a></p>
            <p><strong>Description:</strong> {proj.description}</p>
            <p><strong>Submitted On:</strong> {new Date(proj.submittedOn).toLocaleString()}</p>
            <input
        type="number"
        value={proj.score || ''}
        onChange={(e) => {
          const value = parseInt(e.target.value, 10);
          setProjects((prev) =>
            prev.map((p, i) =>
              i === index ? { ...p, score: isNaN(value) ? '' : value } : p
            )
          );
        }}
        placeholder="Enter score"
        className="mt-2 px-3 py-1 border rounded"
      />
            <button
              onClick={() => handleVerify(proj.menteeId, proj.resourceId,proj.score)}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Verify ✅
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnverifiedProjects;
