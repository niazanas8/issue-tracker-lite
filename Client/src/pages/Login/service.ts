import axios from "axios";

const API_BASE =
  process.env.REACT_APP_LOCAL_API_URL || "http://localhost:3001/";

export const register = async (body: object) => {
  const response = await axios.post(API_BASE + "register", body);
  return response.data;
};

export const login = async (body: object) => {
  const response = await axios.post(API_BASE + "login", body);
  return response.data;
};
