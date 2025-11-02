const axios = require('axios');  // Added: Reliable client (npm i axios if not)

const payload = {
  start: 84729190,
  end: 4249725586  // Try 4249725586 if no path
};

async function testAPI() {
  try {
    const res = await axios.post('http://localhost:3001/compare', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.data, null, 2));
    if (res.data.dijkstra && res.data.aStar) {
      console.log('✅ Success! A* efficiency:', res.data.comparison.nodesCheckedDiff, 'fewer nodes.');
    } else if (res.data.error) {
      console.log('❌ Error:', res.data.error);
    }
  } catch (err) {
    if (err.response) {
      console.log('Status:', err.response.status);
      console.log('Error Body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Request Error:', err.message);
    }
  }
}

testAPI();