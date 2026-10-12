import axios from 'axios';


// USE ENVIRONMENT VARIABLES

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const axiosInstance = axios.create({
  baseURL: BASE_URL || 'http://localhost:5100/api',
  withCredentials: true, 
});


