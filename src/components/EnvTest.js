import React, { useEffect } from 'react';

function EnvTest() {
  useEffect(() => {
    console.log('Environment variables in component:', {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '***' : 'MISSING',
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'MISSING',
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'MISSING',
    });
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '5px' }}>
      <h3>Environment Variables Test</h3>
      <pre>
        {JSON.stringify({
          REACT_APP_FIREBASE_API_KEY: process.env.REACT_APP_FIREBASE_API_KEY ? '***' : 'MISSING',
          REACT_APP_FIREBASE_AUTH_DOMAIN: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'MISSING',
          REACT_APP_FIREBASE_PROJECT_ID: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'MISSING',
          REACT_APP_FIREBASE_STORAGE_BUCKET: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'MISSING',
          REACT_APP_FIREBASE_MESSAGING_SENDER_ID: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'MISSING',
          REACT_APP_FIREBASE_APP_ID: process.env.REACT_APP_FIREBASE_APP_ID || 'MISSING',
        }, null, 2)}
      </pre>
    </div>
  );
}

export default EnvTest;
