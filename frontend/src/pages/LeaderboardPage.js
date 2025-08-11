import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserScore, setCurrentUserScore] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    setCurrentUser(storedUsername);
    fetch('/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard || []));
    if (storedUsername) {
      fetch(`/user_bricks/${storedUsername}`)
        .then(res => res.json())
        .then(data => setCurrentUserScore(data.total_score));
    }
  }, []);

  const handleReturnHome = () => {
    navigate('/');
  };

  // Check if current user is in the top 10
  const userInLeaderboard = leaderboard.find(u => u.username === currentUser);
  // Removed unused currentUserRank variable

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Username</th>
            <th>Total Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((user, idx) => (
            <tr key={user.username} className={user.username === currentUser ? 'current-user-row' : ''}>
              <td>{idx + 1}</td>
              <td>{user.username}</td>
              <td>{user.total_score}</td>
            </tr>
          ))}
          {/* If current user is not in top 10, show their row below */}
          {!userInLeaderboard && currentUser && currentUserScore !== null && (
            <tr className="current-user-row">
              <td>-</td>
              <td>{currentUser}</td>
              <td>{currentUserScore}</td>
            </tr>
          )}
        </tbody>
      </table>
      <button className="return-home-btn" onClick={handleReturnHome}>
        Return to HomePage
      </button>
    </div>
  );
};

export default LeaderboardPage;
