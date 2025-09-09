import { default as api } from './api';

export const signup = async (data) => {
  return api.post('/auth/signup/', data);
};

export const login = async (data) => {
  try {
    // Get the token and user data from the login response
    const response = await api.post('/auth/token/', data);
    const { access: token, user } = response.data;
    
    if (token) {
      localStorage.setItem('token', token);
      
      // If user data is included in the login response, store it
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        return { ...response, user };
      }
      
      // If no user data, just return the response
      return response;
    }
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};