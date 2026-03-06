const axios = require('axios');

async function runTests() {
  // no token, expecting 401 on protected routes
  try {
    await axios.get('http://localhost:5000/api/admin/users');
  } catch (e) {
    console.log('no token /users status', e.response?.status);
  }

  // log in as admin to get token
  const login = await axios.post('http://localhost:5000/api/auth/login', { email: 'moosa@gmail.com', password: 'admin123' });
  const token = login.data.token;
  console.log('got token', token ? 'yes' : 'no');

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const users = await axios.get('http://localhost:5000/api/admin/users', { headers });
    console.log('/users data', users.data);
  } catch (e) {
    console.error('/users error', e.response?.status, e.response?.data);
  }
  try {
    const pending = await axios.get('http://localhost:5000/api/admin/applications', { headers });
    console.log('/applications pending', pending.data);
  } catch (e) {
    console.error('/applications error', e.response?.status, e.response?.data);
  }
  try {
    const approved = await axios.get('http://localhost:5000/api/admin/applications/approved', { headers });
    console.log('/applications/approved', approved.data);
  } catch (e) {
    console.error('/applications/approved error', e.response?.status, e.response?.data);
  }
}

runTests().catch(console.error);
