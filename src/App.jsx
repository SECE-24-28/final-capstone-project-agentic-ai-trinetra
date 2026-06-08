import { useState } from "react";
import TrinetraLogin from "./TrinetraLogin";
import TrinetraDashboard from "./components/TrinetraDashboard";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  return loggedIn ? (
    <TrinetraDashboard />
  ) : (
    <TrinetraLogin onLogin={() => setLoggedIn(true)} />
  );
}

export default App;