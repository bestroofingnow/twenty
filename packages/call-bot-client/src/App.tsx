import React, { useState } from 'react';
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async () => {
    const res = await axios.post('/api/login', { username, password });
    localStorage.setItem('token', res.data.token);
    onLogin();
    navigate('/');
  };

  return (
    <div>
      <h1>Login</h1>
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" />
      <input value={password} type="password" onChange={e => setPassword(e.target.value)} placeholder="password" />
      <button onClick={submit}>Login</button>
    </div>
  );
}

function Dashboard() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const fetchContacts = async () => {
    const res = await axios.get('/api/contacts', { headers: auth() });
    setContacts(res.data);
  };

  const addContact = async () => {
    await axios.post('/api/contacts', { name, phone }, { headers: auth() });
    fetchContacts();
  };

  const uploadCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const form = new FormData();
    form.append('file', e.target.files[0]);
    await axios.post('/api/contacts/upload', form, { headers: { ...auth(), 'Content-Type': 'multipart/form-data' } });
    fetchContacts();
  };

  const startCampaign = async () => {
    await axios.post('/api/campaigns/start', {}, { headers: auth() });
  };

  React.useEffect(() => { fetchContacts(); }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="name" />
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="phone" />
        <button onClick={addContact}>Add</button>
      </div>
      <div>
        <input type="file" onChange={uploadCsv} />
      </div>
      <button onClick={startCampaign}>Start Call Campaign</button>
      <ul>
        {contacts.map(c => <li key={c.id}>{c.name} - {c.phone}</li>)}
      </ul>
    </div>
  );
}

function auth() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
}

export default function App() {
  const [authed, setAuthed] = useState(Boolean(localStorage.getItem('token')));
  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={() => setAuthed(true)} />} />
      <Route path="/*" element={authed ? <Dashboard /> : <Navigate to="/login" />} />
    </Routes>
  );
}
