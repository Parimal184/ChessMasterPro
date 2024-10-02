import React from 'react';
import AppRoutes from './Routes'; // Import your Routes component
import { AuthProvider } from './contexts/AuthContext'; // If you are using an AuthProvider, include it

const App: React.FC = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes /> {/* Include the AppRoutes component */}
      </div>
    </AuthProvider>
  );
};

export default App;
