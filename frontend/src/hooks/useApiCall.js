import { useState, useCallback } from 'react';
import { message } from 'antd';

/**
 * Custom hook for API calls with loading, error handling, and success states
 * @param {Function} apiFunction - The API function to call
 * @param {Object} options - Options for the hook
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApiCall = (apiFunction, options = {}) => {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    showErrorMessage = true,
    showSuccessMessage = false,
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunction(...args);
      const responseData = response?.data?.data || response?.data || response;
      
      setData(responseData);
      
      if (showSuccessMessage && successMessage) {
        message.success(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return responseData;
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 
                      err?.message || 
                      errorMessage || 
                      'An error occurred';
      
      setError(errorMsg);
      
      if (showErrorMessage) {
        message.error(errorMsg);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError, successMessage, errorMessage, showErrorMessage, showSuccessMessage]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

export default useApiCall;
