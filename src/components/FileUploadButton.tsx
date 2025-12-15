import React, { useRef, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

type Props = {
  buttonText?: string;
  onUploaded?: (objectKey: string) => void; // optional: z.B. Todo-Eintrag erstellen
};

// Entweder hardcoden ODER über .env (siehe Schritt 3)
const API_BASE_URL =
  import.meta.env.VITE_UPLOAD_API_BASE_URL ||
  "https://i1bdqqp7zi.execute-api.eu-west-2.amazonaws.com/prod";

export default function FileUploadButton({
  buttonText = "+ new",
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const openFilePicker = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const handleFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Damit du dieselbe Datei nochmal auswählen kannst:
    e.target.value = "";

    try {
      setIsUploading(true);

      // Cognito JWT holen (für API Gateway Authorizer)
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      if (!idToken) {
        throw new Error("No idToken found (user not authenticated?)");
      }

      // 1) Presigned URL anfordern
      const res = await fetch(`${API_BASE_URL}/upload-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: idToken,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to get uploadUrl (${res.status}): ${text}`);
      }

      const { uploadUrl, objectKey } = await res.json();

      // 2) Datei direkt zu S3 hochladen (PUT auf Presigned URL)
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putRes.ok) {
        const text = await putRes.text();
        throw new Error(`S3 upload failed (${putRes.status}): ${text}`);
      }

      // optional callback (z.B. in Todo-Liste anzeigen)
      onUploaded?.(objectKey);
      alert("Upload successful!");
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Upload fehlgeschlagen");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".fit"
        style={{ display: "none" }}
        onChange={handleFileSelected}
      />

      <button onClick={openFilePicker} disabled={isUploading}>
        {isUploading ? "Uploading..." : buttonText}
      </button>
    </>
  );
}
