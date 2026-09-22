export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred') => {
  if (error.response) {
    // The server responded with a status code outside the 2xx range
    return error.response.data?.message || error.response.data?.error || `Server Error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    return 'Unable to reach the server. Please check your connection.';
  } else {
    // Something happened in setting up the request
    return error.message || defaultMessage;
  }
};
