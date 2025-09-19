import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Main } from "./containers";
import { Loading, Login } from "./pages";
import { pingServer, userSecurity } from "./service";
import { getCookie } from "./utils/api";
import Header from "./components/Header";

function App() {
  const [serverIsDown, setServerIsDown] = useState<boolean>(true);
  const location = useLocation();

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await pingServer();
        if (response) {
          const credentials = await userSecurity();
          setServerIsDown(credentials !== "Valid Credentials");
        }
      } catch {
        console.log("Server is Down try refreshing");
      }
    };
    checkServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLoginPage = location.pathname.startsWith("/login");

  return (
    <div className="App" style={{ height: "100%" }}>
      {/* Show header on all app pages except the login route and when server is down */}
      {!serverIsDown && !onLoginPage && <Header />}

      <Routes>
        <Route
          path="/*"
          element={
            serverIsDown ? (
              <Loading />
            ) : getCookie("AuthToken") ? (
              <Main />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={
            serverIsDown ? (
              <Loading />
            ) : !getCookie("AuthToken") ? (
              <Login />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
