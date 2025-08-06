import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesResponse, usersResponse] = await Promise.all([
        axios.get('http://localhost:8000/messages'),
        axios.get('http://localhost:8000/users')
      ]);
      
      setMessages(messagesResponse.data);
      setUsers(usersResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>DuDuolingo</h1>
        <p>Welcome to your language learning journey!</p>
      </header>
      
      <main className="App-main">
        <section className="messages-section">
          <h2>Messages</h2>
          <div className="messages-list">
            {messages.map(message => (
              <div key={message.id} className="message-card">
                {message.text}
              </div>
            ))}
          </div>
        </section>

        <section className="users-section">
          <h2>Users</h2>
          <div className="users-list">
            {users.map(user => (
              <div key={user.id} className="user-card">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
