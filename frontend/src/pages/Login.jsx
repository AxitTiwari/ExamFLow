
import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const initial = {
  full_name: '',
  email: '',
  password: '',
  roll_number: '',
  course_id: '',
  branch_id: '',
  academic_year: '3',
  semester: '5',
  employee_code: '',
  department: '',
  designation: ''
};

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('STUDENT');
  const [form, setForm] = useState({
    email: 'admin@examflow.local',
    password: 'Admin@123'
  });
  const [reg, setReg] = useState(initial);
  const [courses, setCourses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api('/admin/courses')
      .then(r => setCourses(r.courses || []))
      .catch(() => {});
    api('/admin/branches')
      .then(r => setBranches(r.branches || []))
      .catch(() => {});
  }, []);

  async function login(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });

      if (r.user.status === 'PENDING') {
        setNotice('Your account is awaiting administrator approval.');
      }

      onLogin(r.user);
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  async function register(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');

    try {
      const endpoint = role === 'STUDENT'
        ? '/auth/register/student'
        : '/auth/register/teacher';

      const body = role === 'STUDENT'
        ? {
            ...reg,
            course_id: Number(reg.course_id),
            branch_id: Number(reg.branch_id),
            academic_year: Number(reg.academic_year),
            semester: Number(reg.semester)
          }
        : reg;

      const r = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
      });

      setNotice(r.message || 'Registration submitted.');
      setMode('login');
      setForm({
        email: reg.email,
        password: reg.password
      });
    } catch (x) {
      setError(x.message);
    } finally {
      setBusy(false);
    }
  }

  const updateReg = (key, value) =>
    setReg(old => ({ ...old, [key]: value }));

  return (
    <main className="auth-page">

      <section className="auth-left">
        <div className="auth-brand">
          <div className="auth-logo">E</div>
          <div>
            <strong>ExamFlow</strong>
            <span>UNIVERSITY EXAM MANAGEMENT</span>
          </div>
        </div>

        <div className="auth-form-container">

          <div className="auth-eyebrow">
            {mode === 'login' ? 'WELCOME BACK' : 'JOIN EXAMFLOW'}
          </div>

          <h1>
            {mode === 'login'
              ? <>Welcome <span>back.</span></>
              : <>Create your <span>account.</span></>}
          </h1>

          <p className="auth-description">
            {mode === 'login'
              ? 'Sign in to manage your academic workspace and examination activities.'
              : 'Register to access your university examination workspace.'}
          </p>

          {error && <div className="auth-alert error">{error}</div>}
          {notice && <div className="auth-alert success">{notice}</div>}

          {mode === 'login' ? (
            <form onSubmit={login} className="auth-form">

              <label>
                Email address
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={e =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </label>

              <label>
                Password
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={e =>
                      setForm({ ...form, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <button className="auth-submit" disabled={busy}>
                {busy ? 'Signing in...' : 'Sign in to workspace'}
                <span>→</span>
              </button>

              <div className="auth-demo">
                <div className="auth-demo-title">
                  <span>DEMO ACCESS</span>
                  <span className="demo-dot" />
                </div>
                <p><b>Admin</b> · admin@examflow.local</p>
                <p><b>Student</b> · student@examflow.local</p>
                <p><b>Teacher</b> · teacher@examflow.local</p>
                <small>Demo password: Admin@123 / Student@123 / Teacher@123</small>
              </div>

              <div className="auth-bottom">
                Don't have an account?
                <button type="button" onClick={() => {
                  setMode('register');
                  setError('');
                  setNotice('');
                }}>
                  Register here
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={register} className="auth-form">

              <div className="auth-role-tabs">
                <button
                  type="button"
                  className={role === 'STUDENT' ? 'selected' : ''}
                  onClick={() => setRole('STUDENT')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={role === 'TEACHER' ? 'selected' : ''}
                  onClick={() => setRole('TEACHER')}
                >
                  Teacher
                </button>
              </div>

              <label>
                Full name
                <input required value={reg.full_name}
                  onChange={e => updateReg('full_name', e.target.value)} />
              </label>

              <label>
                Email address
                <input type="email" required value={reg.email}
                  onChange={e => updateReg('email', e.target.value)} />
              </label>

              <label>
                Password
                <input type="password" required value={reg.password}
                  onChange={e => updateReg('password', e.target.value)} />
              </label>

              {role === 'STUDENT' ? (
                <>
                  <label>
                    University roll number
                    <input required value={reg.roll_number}
                      onChange={e => updateReg('roll_number', e.target.value)} />
                  </label>

                  <div className="auth-two-fields">
                    <label>
                      Course
                      <select required value={reg.course_id}
                        onChange={e => {
                          updateReg('course_id', e.target.value);
                          updateReg('branch_id', '');
                        }}>
                        <option value="">Select course</option>
                        {courses.map(c =>
                          <option key={c.id} value={c.id}>{c.name}</option>
                        )}
                      </select>
                    </label>

                    <label>
                      Branch
                      <select required value={reg.branch_id}
                        onChange={e => updateReg('branch_id', e.target.value)}>
                        <option value="">Select branch</option>
                        {branches
                          .filter(b => !reg.course_id ||
                            String(b.course_id) === String(reg.course_id))
                          .map(b =>
                            <option key={b.id} value={b.id}>{b.name}</option>
                          )}
                      </select>
                    </label>
                  </div>

                  <div className="auth-two-fields">
                    <label>
                      Academic year
                      <select value={reg.academic_year}
                        onChange={e => updateReg('academic_year', e.target.value)}>
                        {[1, 2, 3, 4, 5, 6].map(v =>
                          <option key={v} value={v}>{v}</option>
                        )}
                      </select>
                    </label>

                    <label>
                      Semester
                      <select value={reg.semester}
                        onChange={e => updateReg('semester', e.target.value)}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(v =>
                          <option key={v} value={v}>{v}</option>
                        )}
                      </select>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label>
                    Employee ID
                    <input required value={reg.employee_code}
                      onChange={e => updateReg('employee_code', e.target.value)} />
                  </label>

                  <label>
                    Department
                    <input required value={reg.department}
                      onChange={e => updateReg('department', e.target.value)} />
                  </label>

                  <label>
                    Designation
                    <input value={reg.designation}
                      onChange={e => updateReg('designation', e.target.value)} />
                  </label>
                </>
              )}

              <button className="auth-submit" disabled={busy}>
                {busy ? 'Submitting...' : 'Create account'}
                <span>→</span>
              </button>

              {role === 'TEACHER' && (
                <small className="auth-hint">
                  Teacher accounts require administrator approval.
                </small>
              )}

              <div className="auth-bottom">
                Already registered?
                <button type="button" onClick={() => {
                  setMode('login');
                  setError('');
                  setNotice('');
                }}>
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="auth-footer">
          © 2026 ExamFlow · University Examination Management
        </div>
      </section>

      <section className="auth-right">
        <div className="auth-orb orb-one" />
        <div className="auth-orb orb-two" />

        <div className="auth-right-content">
          <div className="visual-tag">
            <span /> SMART EXAMINATION MANAGEMENT
          </div>

          <h2>
            One workspace.<br />
            <span>Every examination.</span>
          </h2>

          <p>
            Simplifying academic administration, resource allocation
            and examination scheduling.
          </p>

          <div className="visual-dashboard">
            <div className="visual-top">
              <div>
                <small>EXAMFLOW OVERVIEW</small>
                <strong>Academic dashboard</strong>
              </div>
              <span className="visual-live">● LIVE</span>
            </div>

            <div className="visual-stats">
              <div>
                <small>Students</small>
                <b>1,250</b>
                <span>Registered</span>
              </div>
              <div>
                <small>Examinations</small>
                <b>48</b>
                <span>This session</span>
              </div>
              <div>
                <small>Rooms</small>
                <b>32</b>
                <span>Available</span>
              </div>
            </div>

            <div className="visual-schedule">
              <div className="visual-schedule-heading">
                <b>Examination schedule</b>
                <small>Sample preview</small>
              </div>

              <div className="visual-row">
                <span className="visual-date">01</span>
                <div><b>Database Management</b><small>09:00 AM · Room 204</small></div>
                <i className="visual-chip">Scheduled</i>
              </div>

              <div className="visual-row">
                <span className="visual-date purple">03</span>
                <div><b>Computer Networks</b><small>10:00 AM · Room 108</small></div>
                <i className="visual-chip">Scheduled</i>
              </div>

              <div className="visual-row">
                <span className="visual-date teal">05</span>
                <div><b>Operating Systems</b><small>02:00 PM · Room 302</small></div>
                <i className="visual-chip">Scheduled</i>
              </div>
            </div>
          </div>

          <div className="visual-caption">
            <span>✦</span>
            Organized academics. Smarter scheduling.
          </div>
        </div>
      </section>

    </main>
  );
}
