import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';

const useFieldValidation = (initialValue = '', type = '', options = {}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const {
    required = false,
    minLength = 0,
    maxLength = 100,
    pattern = null,
    checkAvailability = false,
  } = options;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_-]+$/;
    return re.test(username);
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const checkFieldAvailability = useCallback(
    debounce(async (value) => {
      if (!value || value.length < 3) return;
      
      setIsChecking(true);
      try {
        const response = await axios.post('/api/auth/check-availability', {
          type,
          value
        });
        setIsAvailable(response.data.available);
        if (!response.data.available) {
          setError(response.data.message);
        } else {
          setError('');
        }
      } catch (error) {
        console.error('Error checking availability:', error);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [type]
  );

  const validate = useCallback(() => {
    if (!isDirty) return true;

    if (required && !value) {
      setError(`${type.charAt(0).toUpperCase() + type.slice(1)} is required`);
      return false;
    }

    if (value.length < minLength) {
      setError(`Must be at least ${minLength} characters`);
      return false;
    }

    if (value.length > maxLength) {
      setError(`Must be less than ${maxLength} characters`);
      return false;
    }

    if (pattern && !pattern.test(value)) {
      setError(`Invalid ${type} format`);
      return false;
    }

    if (type === 'email' && value && !validateEmail(value)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (type === 'username' && value && !validateUsername(value)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens');
      return false;
    }

    if (type === 'password' && value) {
      const passwordError = validatePassword(value);
      if (passwordError) {
        setError(passwordError);
        return false;
      }
    }

    setError('');
    return true;
  }, [value, required, minLength, maxLength, pattern, type, isDirty]);

  useEffect(() => {
    if (isDirty) {
      validate();
    }
    
    if (checkAvailability && value.length >= 3) {
      checkFieldAvailability(value);
    }
  }, [value, validate, checkAvailability, isDirty]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsDirty(true);
  };

  return {
    value,
    error,
    isAvailable,
    isChecking,
    isDirty,
    handleChange,
    setError,
    validate,
    setValue,
    setIsDirty
  };
};

export default useFieldValidation;
