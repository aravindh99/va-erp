import "./login.css";
import api from "../service/api";
import { useNavigate } from "react-router-dom";
import lo from '../assets/lo.png'

export default function Login() {
  const navigate = useNavigate();
  async function handleForm(formData) {
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const res = await api.post("/api/auth/login", { username, password });
      const token = res.data.token;
      // Store token
      localStorage.setItem("token", token);

      // Redirect
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <div className="login-container">
        <div className="left-login">
          
         
          <img src={lo} alt="logo" />
          
         
            <h1 className="head">Welcome to venkateswara!</h1>
            
           
        </div>
        <div className="right-login">
          <form action={handleForm}>
            <label for="uname">Username</label>
            <input type="text" name="username" id="uname" required />
            <label for="pass">Password</label>
            <input type="password" name="password" id="pass" required />
            <input
              type="submit"
              value={"login"}
              className="styleee"
              style={{
                minWidth: "10ch",
                background: "linear-gradient(135deg,rgb(59, 44, 136), #9e8bff)",
                color: "white",
                textAlign: "center",
                paddingBottom: "7px",
                cursor: "pointer",
                border: "none",
              }}
            />
          </form>
        </div>
      </div>
    </>
  );
}
