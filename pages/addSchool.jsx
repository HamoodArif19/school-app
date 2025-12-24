import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';

export default function AddSchool() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const onSubmit = async (data) => {
    setMsg(null);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('address', data.address || '');
      formData.append('city', data.city || '');
      formData.append('state', data.state || '');
      formData.append('contact', data.contact || '');
      formData.append('email_id', data.email_id);
      if (data.image && data.image[0]) formData.append('image', data.image[0]);

      const res = await axios.post('/api/schools', formData);


      setMsg({ type: 'success', text: 'School added successfully!' });
      reset();
      setPreview(null);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Upload failed' });
    }
  };

  return (
    <div className="container">
      <Head><title>Add School</title></Head>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Add School</h1>
        <Link href="/showSchools">View Schools</Link>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
          <div className="field">
            <label>Name *</label>
            <input {...register('name', { required: 'Name required' })} />
            {errors.name && <small style={{color:'red'}}>{errors.name.message}</small>}
          </div>

          <div className="field">
            <label>Email *</label>
            <input {...register('email_id', { required: 'Email required', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })} />
            {errors.email_id && <small style={{color:'red'}}>{errors.email_id.message}</small>}
          </div>

          <div className="field">
            <label>Address</label>
            <textarea {...register('address')} rows="2"></textarea>
          </div>

          <div style={{display:'flex', gap:12, flexWrap:'wrap'}}>
            <div style={{ flex:1 }} className="field">
              <label>City</label>
              <input {...register('city')} />
            </div>
            <div style={{ flex:1 }} className="field">
              <label>State</label>
              <input {...register('state')} />
            </div>
            <div style={{ flex:1 }} className="field">
              <label>Contact</label>
              <input type="number" {...register('contact')} />
            </div>
          </div>

          <div className="field">
            <label>Image</label>
            <input type="file" accept="image/*" {...register('image')} onChange={onFileChange} />
            {preview && (
              <div style={{ marginTop: 8 }}>
                <img src={preview} alt="preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 8 }} />
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Add School'}</button>
            <span style={{ marginLeft: 12 }}>{msg && <small style={{ color: msg.type === 'error' ? 'red' : 'green' }}>{msg.text}</small>}</span>
          </div>
        </form>
      </div>
    </div>
  );
}
