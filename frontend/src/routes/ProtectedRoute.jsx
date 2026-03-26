import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { getToken, getUser } from "../utils/storage";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, setAuth } = useAuthStore();
  const [checking, setChecking] = useState(true)

  useEffect(()=>{
    if(!isLoggedIn){
      const token = getToken()
      const user = getUser()
      if(token && user){
        setAuth(token, user)
      }
    }
    setChecking(false)
  }, [])

  if(checking) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}