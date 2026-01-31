// Working minimal version - use this to test
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #dbeafe, #e0e7ff)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            LLM Quiz Platform
          </h1>
          <p style={{ fontSize: '20px', color: '#4b5563', marginBottom: '32px' }}>
            Practice, Compete, and Excel
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <a
              href="/login"
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Sign In
            </a>
            <a
              href="/register"
              style={{
                backgroundColor: 'white',
                color: '#4f46e5',
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500',
                border: '2px solid #4f46e5'
              }}
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;


