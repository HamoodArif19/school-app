import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';

export default function ShowSchools() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/schools');
      setSchools(res.data);
    } catch (err) {
      console.error(err);
      setSchools([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      <Head><title>Schools</title></Head>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Schools</h1>
        <Link href="/addSchool">Add School</Link>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && schools.length === 0 && <p>No schools found. Add some.</p>}

      <div className="grid">
        {schools.map(s => (
          <div key={s.id} className="card">
            <img src={s.image || '/placeholder.png'} alt={s.name} />
            <div className="meta">
              <div className="title">{s.name}</div>
              <div className="addr">{s.address?.substring(0, 80)}{s.address && s.address.length > 80 ? '...' : ''}</div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#6b7280' }}>{s.city || ''}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
