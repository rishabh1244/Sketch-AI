"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Folder,
  FileText,
  FolderInput,
  Copy,
  Edit2,
  Trash2,
  Plus,
  ChevronRight,
} from "lucide-react";

interface Folder {
  id: string;
  name: string;
  created_at: string;
}

interface Sketch {
  id: string;
  name: string;
  folder_id: string | null;
  data: any;
  updated_at: string;
}

function formatRelativeTime(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.round(diffMs / 86400000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays}d ago`;
}

function getSketchSize(data: any) {
  if (!data) return "0 KB";
  try {
    const bytes = new Blob([JSON.stringify(data)]).size;
    if (bytes < 1024) return `${bytes} B`;
    const kb = (bytes / 1024).toFixed(1);
    if (parseFloat(kb) < 1024) return `${kb} KB`;
    return `${(parseFloat(kb) / 1024).toFixed(1)} MB`;
  } catch {
    return "0.5 KB";
  }
}

export default function DashboardOverview() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Rename states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const fetchData = async () => {
    try {
      const [foldersRes, sketchesRes] = await Promise.all([
        fetch("/api/folders"),
        fetch("/api/diagram")
      ]);
      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        setFolders(foldersData);
      }
      if (sketchesRes.ok) {
        const sketchesData = await sketchesRes.json();
        setSketches(sketchesData);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDiagram = (id: string) => {
    window.open(`/canvas?id=${id}`, "_blank");
  };

  const handleCreateCanvas = async () => {
    try {
      const response = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Untitled Sketch",
          folder_id: currentFolderId
        })
      });
      if (response.ok) {
        const newSketch = await response.json();
        setSketches(prev => [newSketch, ...prev]);
        window.open(`/canvas?id=${newSketch.id}`, "_blank");
      }
    } catch (err) {
      console.error("Failed to create canvas:", err);
    }
  };

  const handleCreateFolder = async () => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Unnamed Folder" })
      });
      if (response.ok) {
        const newFolder = await response.json();
        setFolders(prev => [newFolder, ...prev]);
        setEditingId(newFolder.id);
        setEditingName(newFolder.name);
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleRename = async (id: string, isFolder: boolean) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    try {
      const url = isFolder ? "/api/folders" : "/api/diagram";
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editingName.trim() })
      });
      if (response.ok) {
        const updated = await response.json();
        if (isFolder) {
          setFolders(prev => prev.map(f => f.id === id ? updated : f));
        } else {
          setSketches(prev => prev.map(s => s.id === id ? updated : s));
        }
      }
    } catch (err) {
      console.error("Failed to rename:", err);
    } finally {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleDelete = async (id: string, isFolder: boolean) => {
    if (!confirm(`Are you sure you want to delete this ${isFolder ? "folder" : "sketch"}?`)) return;
    try {
      const url = isFolder ? `/api/folders?id=${id}` : `/api/diagram?id=${id}`;
      const response = await fetch(url, { method: "DELETE" });
      if (response.ok) {
        if (isFolder) {
          setFolders(prev => prev.filter(f => f.id !== id));
          if (currentFolderId === id) {
            setCurrentFolderId(null);
          }
        } else {
          setSketches(prev => prev.filter(s => s.id !== id));
        }
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleDuplicate = async (sketch: Sketch) => {
    try {
      const response = await fetch("/api/diagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${sketch.name} (Copy)`,
          folder_id: sketch.folder_id,
          data: sketch.data
        })
      });
      if (response.ok) {
        const newSketch = await response.json();
        setSketches(prev => [newSketch, ...prev]);
      }
    } catch (err) {
      console.error("Failed to duplicate:", err);
    }
  };

  const handleMoveToFolder = async (sketchId: string, folderId: string | null) => {
    try {
      const response = await fetch("/api/diagram", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sketchId, folder_id: folderId })
      });
      if (response.ok) {
        const updated = await response.json();
        setSketches(prev => prev.map(s => s.id === sketchId ? updated : s));
      }
    } catch (err) {
      console.error("Failed to move sketch to folder:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-white/60">
        <span className="block h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <span className="ml-3 text-sm">Loading dashboard...</span>
      </div>
    );
  }

  const currentFolder = folders.find(f => f.id === currentFolderId);
  const filteredSketches = sketches.filter(s => s.folder_id === currentFolderId);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
          <p className="text-sm text-white/50">Manage your sketches and diagrams</p>
        </div>
        <Button onClick={handleCreateCanvas} className="hover:bg-white hover:text-black text-white rounded-lg flex items-center gap-2 cursor-pointer border border-white/10">
          <Plus className="h-4 w-4" />
          <span>Create Canvas</span>
        </Button>
      </div>

      {/* Breadcrumbs */}
      {currentFolderId && (
        <div className="flex items-center gap-2 text-sm text-white/60 -mt-4">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={() => setCurrentFolderId(null)}>Home</span>
          <ChevronRight className="h-4 w-4 opacity-55" />
          <span className="text-white font-medium">{currentFolder?.name}</span>
        </div>
      )}

      {/* Folders View (Only rendered at Root level) */}
      {!currentFolderId && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {folders.map((folder) => {
              const folderSketches = sketches.filter(s => s.folder_id === folder.id);
              const latestDate = folderSketches.length > 0 
                ? folderSketches[0].updated_at
                : folder.created_at;

              return (
                <Card 
                  key={folder.id} 
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-white/90 w-full mr-2">
                      <Folder className="h-4 w-4 text-blue-400 shrink-0" />
                      {editingId === folder.id ? (
                        <input
                          className="bg-white/5 border border-white/20 rounded-md px-1.5 py-0.5 text-sm text-white w-full focus:outline-none focus:border-white/40"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={() => handleRename(folder.id, true)}
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRename(folder.id, true);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{folder.name}</span>
                      )}
                    </CardTitle>
                    <CardAction onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 text-white/50 hover:text-black hover:bg-white rounded-lg cursor-pointer">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white/90">
                          <DropdownMenuItem 
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                            onClick={() => {
                              setEditingId(folder.id);
                              setEditingName(folder.name);
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="focus:bg-white/10 focus:text-white cursor-pointer text-red-400 focus:text-red-300"
                            onClick={() => handleDelete(folder.id, true)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-white/50">
                      {folderSketches.length} items • Updated {formatRelativeTime(latestDate)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card 
              className="border-2 border-dashed border-white/10 bg-transparent hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[108px] text-white/50 hover:text-white group"
              onClick={handleCreateFolder}
            >
              <Plus className="h-5 w-5 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium">Create Folder</span>
            </Card>
          </div>
        </div>
      )}

      {/* Sketches View */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-white">
          {currentFolderId ? "Sketches in Folder" : "Recent Sketches"}
        </h2>
        
        {filteredSketches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-white/5 rounded-xl bg-white/5 text-white/40">
            <FileText className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No sketches found here.</p>
            <Button onClick={handleCreateCanvas} variant="link" className="text-blue-400 hover:text-blue-300 text-xs mt-1">
              Create a new canvas
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSketches.map((file) => (
              <Card
                key={file.id}
                className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => handleOpenDiagram(file.id)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2 w-full mr-2">
                    <div className="p-2 bg-white/5 rounded-md shrink-0">
                      <FileText className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="min-w-0 w-full">
                      <CardTitle className="text-sm font-medium text-white/90">
                        {editingId === file.id ? (
                          <input
                            className="bg-white/5 border border-white/20 rounded-md px-1.5 py-0.5 text-sm text-white w-full focus:outline-none focus:border-white/40"
                            value={editingName}
                            onChange={e => setEditingName(e.target.value)}
                            onBlur={() => handleRename(file.id, false)}
                            onKeyDown={e => {
                              if (e.key === "Enter") handleRename(file.id, false);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="truncate block">{file.name}</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-white/50 mt-1">
                        {formatRelativeTime(file.updated_at)}
                      </CardDescription>
                    </div>
                  </div>

                  <CardAction onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-white/50 hover:text-black hover:bg-white rounded-lg cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white/90">
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="cursor-pointer focus:bg-white/10">
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move to folder
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className="bg-[#1a1a1a] border-white/10 text-white/90">
                            <DropdownMenuItem 
                              className="focus:bg-white/10 focus:text-white cursor-pointer"
                              disabled={file.folder_id === null}
                              onClick={() => handleMoveToFolder(file.id, null)}
                            >
                              Home / Root
                            </DropdownMenuItem>
                            {folders.map(f => (
                              <DropdownMenuItem 
                                key={f.id} 
                                className="focus:bg-white/10 focus:text-white cursor-pointer"
                                disabled={file.folder_id === f.id}
                                onClick={() => handleMoveToFolder(file.id, f.id)}
                              >
                                {f.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuItem 
                          className="focus:bg-white/10 focus:text-white cursor-pointer"
                          onClick={() => handleDuplicate(file)}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="focus:bg-white/10 focus:text-white cursor-pointer"
                          onClick={() => {
                            setEditingId(file.id);
                            setEditingName(file.name);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="focus:bg-white/10 focus:text-white cursor-pointer text-red-400 focus:text-red-300"
                          onClick={() => handleDelete(file.id, false)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-white/40 mt-2">
                    {getSketchSize(file.data)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
