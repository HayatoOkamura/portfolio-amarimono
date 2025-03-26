import axios from "axios";
import { backendUrl } from "./apiUtils";

export const api = axios.create({
  baseURL: backendUrl,
  headers: {
    "Content-Type": "application/json",
  },
}); 