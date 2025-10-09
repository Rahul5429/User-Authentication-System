import { Grid } from "@mui/material";
import { useSelector } from "react-redux";

const Home = () => {
  // Getting User Data from Redux Store
  const myData = useSelector(state => state.user)
  console.log("Home", myData)

  return <>
    <Grid container justifyContent='center'>
      <Grid item sm={10}>
        <h1>Home Page {myData.name}</h1>
        <hr />
        <p>User-Authentication-System is a secure and modern authentication app built using the MERN stack (MongoDB, Express.js, React.js, Node.js) with complete user management features.

It allows users to register, log in, recover passwords, change passwords, and access a personalized dashboard — all protected with JWT authentication for maximum security.</p>
      </Grid>
    </Grid>
  </>;
};

export default Home;
