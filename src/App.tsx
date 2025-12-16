import { useAuthenticator } from "@aws-amplify/ui-react";
import FileUploadButton from "./components/FileUploadButton";
import ActivitiesChart from "./components/ActivitiesChart";

function App() {
  const { user, signOut } = useAuthenticator();

  return (
    <main>
      <h1>Your ride analyzer</h1>
      <h3>{user?.signInDetails?.loginId}</h3>

      <FileUploadButton buttonText="+ UPLOAD" />
      <ActivitiesChart />

      <div style={{ marginTop: "12px" }}>
        App successfully hosted. Try uploading a .fit-File
      </div>

      <button onClick={signOut} style={{ marginTop: "24px" }}>
        Sign out
      </button>
    </main>
  );
}

export default App;
