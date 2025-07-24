import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import Dashboard from "./components/Dashboard";
import EmailBuilder from "./components/EmailBuilder";
import TemplateLibrary from "./components/TemplateLibrary";
import EmailAnalytics from "./components/EmailAnalytics";
import ApiKeyManager from "./components/ApiKeyManager";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Simple auth context (we'll enhance this later)
export const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('email_platform_api_key') || '');
  
  const updateApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('email_platform_api_key', key);
  };

  return (
    <AuthContext.Provider value={{ apiKey, updateApiKey }}>
      {children}
    </AuthContext.Provider>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/builder" element={<EmailBuilder />} />
            <Route path="/templates" element={<TemplateLibrary />} />
            <Route path="/analytics" element={<EmailAnalytics />} />
            <Route path="/api-keys" element={<ApiKeyManager />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;
