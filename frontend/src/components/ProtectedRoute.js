import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

/**
 * ProtectedRoute - Ensures only authenticated users with correct role can access a page
 * @param {React.Component} element - The component to render if authorized
 * @param {string} requiredRole - The role required to access this route (optional, any authenticated user if not specified)
 * @returns {React.Component} - Either the protected element or redirect to login
 */
const ProtectedRoute = ({ element, requiredRole = null }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Not authenticated
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  // Parse user
  try {
    const user = JSON.parse(userStr);
    
    // Check role if required
    if (requiredRole && user.role !== requiredRole) {
      return <Navigate to="/login" replace />;
    }

    return element;
  } catch (error) {
    console.error('Error parsing user data:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
