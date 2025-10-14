import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  useEffect(() => { nav('/'); }, [nav]);
  return null;
}
