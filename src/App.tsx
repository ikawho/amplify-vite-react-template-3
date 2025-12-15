import { useEffect, useState } from "react";
import { useAuthenticator } from '@aws-amplify/ui-react';
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";
import FileUploadButton from "./components/FileUploadButton";

const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);
  const { user, signOut } = useAuthenticator();
  
  useEffect(() => {
    client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
  }, []);

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id })
  }

  return (
    <main>
            <h1>Your ride analyzer</h1>
      <FileUploadButton buttonText="+ UPLOAD" />
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}></li>
        ))}
      </ul>
      <div>
        App successfully hosted. Try uploading a .fit-File
        <br />
      </div>
      <button onClick={signOut} style={{ marginTop: "12px" }}>
      Sign out
      </button>
    </main>
  );
}

export default App;
