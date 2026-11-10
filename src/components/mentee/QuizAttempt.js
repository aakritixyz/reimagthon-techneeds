'use client';
import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function QuizAttempt({ resourceId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('menteeToken') : '';

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/m/resources/${resourceId}/quiz`, {
          headers: { 'x-auth-token': token },
        });
        setQuiz(res.data);
        setAnswers(res.data.questions.map((_, i) => ({ questionId: _.id, selectedOptionIndex: -1 })));
        setLoading(false);
      } catch (err) {
        alert(err.response?.data?.error || 'Error fetching quiz');
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [resourceId]);

  const handleOptionChange = (qIndex, optIndex) => {
    const updated = [...answers];
    updated[qIndex].selectedOptionIndex = optIndex;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/m/resources/${resourceId}/quiz/submit`, {
        answers,
      }, {
        headers: { 'x-auth-token': token }
      });
      alert(`Quiz submitted! Score: ${res.data.score}`);
      onComplete(res.data.score); // Notify parent to update state
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting quiz');
    }
  };

  if (loading) return <div>Loading Quiz...</div>;
  if (!quiz) return <div>No quiz found.</div>;

  return (
    <div>
      <h2>{quiz.title}</h2>
      <p>{quiz.description}</p>
      {quiz.questions.map((q, i) => (
        <div key={q.id} style={{ marginBottom: '1rem' }}>
          <strong>Q{i + 1}: {q.questionText}</strong><br />
          {q.options.map((opt, j) => (
            <div key={j}>
              <label>
                <input
                  type="radio"
                  name={`question-${i}`}
                  value={j}
                  checked={answers[i].selectedOptionIndex === j}
                  onChange={() => handleOptionChange(i, j)}
                />
                {opt}
              </label>
            </div>
          ))}
        </div>
      ))}
      <button disabled={answers.some(a => a.selectedOptionIndex < 0)} onClick={handleSubmit}>Submit Quiz</button>
    </div>
  );
}
