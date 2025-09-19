import { Box, Paper } from "@mui/material";
import axios from "axios";
import React from "react";
import { useCookies } from "react-cookie";

const API_BASE =
  process.env.REACT_APP_LOCAL_API_URL || "http://localhost:3001/";

interface Props {
  id: string;
  email: string;
  role: string;
  dateRegistered?: string;
  ipAddress?: string;
}

const UserProfile = ({ id, email, role, dateRegistered, ipAddress }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cookies, setCookie, removeCookie] = useCookies<any>(["user"]);

  const handleBanUser = async () => {
    if (!ipAddress) return;
    try {
      const response = await axios.post(
        API_BASE + "banUser",
        { ip: ipAddress },
        {
          headers: {
            "x-access-token": cookies.AuthToken,
            email: cookies.Email,
          },
        }
      );
      console.log(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Paper sx={{ padding: "1rem", margin: "1rem" }} elevation={3}>
        <p>Id: {id}</p>
        <hr />
        <p>Name: {email}</p>
        <p>Role: {role}</p>
        <p>
          Registered:{" "}
          <span style={{ color: "orange" }}>
            {dateRegistered ? dateRegistered : "No Date Found"}
          </span>
        </p>
        <p>
          Ip: <b>{ipAddress ? ipAddress : "No Address Found"}</b>
        </p>
        {ipAddress && <button onClick={handleBanUser}>Ban Ip Address</button>}
      </Paper>
    </Box>
  );
};

export default UserProfile;
