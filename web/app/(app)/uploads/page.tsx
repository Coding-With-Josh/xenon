"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type UploadItem = { id: number; type: string; url: string; createdAt: string };

export default function UploadsPage() {
  const [list, setList] = useState<UploadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/upload")
      .then((res) => res.json())
      .then(setList)
      .finally(() => setLoading(false));
  }, []);

  async function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.set("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setList((prev) => [{ id: data.id, type: file.type.includes("pdf") ? "pdf" : "image", url: data.url, createdAt: new Date().toISOString() }, ...prev]);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function processUpload(id: number) {
    setProcessingId(id);
    try {
      const res = await fetch("/api/upload/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.contentId) window.location.href = `/notes/${data.contentId}`;
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium">Uploads</h1>
        <p className="text-muted-foreground text-sm">Upload PDFs or images. Process PDFs to generate notes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload file</CardTitle>
          <CardContent className="pt-0">
            <label className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={onFileSelect}
                disabled={uploading}
                className="text-sm"
              />
              <span className="text-muted-foreground text-sm">{uploading ? "Uploading..." : "PDF or image (max 10MB)"}</span>
            </label>
          </CardContent>
        </CardHeader>
      </Card>
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">No uploads yet.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {list.map((u) => (
            <Card key={u.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{u.type}</p>
                  <p className="text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <a href={u.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm underline">Open</a>
                  {u.type === "pdf" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId !== null}
                      onClick={() => processUpload(u.id)}
                    >
                      {processingId === u.id ? "Processing..." : "Generate notes"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
