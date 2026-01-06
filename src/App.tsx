import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Upload, FileUp, Cloud, FileText, Image, File, Share2, Copy, Check, Trash2, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Toaster, toast } from 'sonner';
import { useGetFiles, useAddFile, useGetFileContent } from '@/hooks/useQueries';

const queryClient = new QueryClient();

function FileStorageApp() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [fileToDelete, setFileToDelete] = useState<bigint | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const { data: files = [], isLoading: isLoadingFiles } = useGetFiles();
  const addFileMutation = useAddFile();
  const getFileContentMutation = useGetFileContent();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadProgress(0);
      
      toast.success(`Selected: ${file.name}`, {
        description: `Size: ${(file.size / 1024).toFixed(2)} KB`
      });

      // Send file metadata to backend immediately
      addFileMutation.mutate(
        { 
          name: file.name, 
          size: BigInt(file.size) 
        },
        {
          onSuccess: () => {
            // Complete progress bar to 100% on success
            setUploadProgress(100);
            toast.success('File uploaded successfully!');
            
            // Reset after a short delay
            setTimeout(() => {
              setIsUploading(false);
              setUploadProgress(0);
            }, 500);
          },
          onError: (error) => {
            toast.error('Failed to upload file');
            console.error('Upload error:', error);
            setIsUploading(false);
            setUploadProgress(0);
          }
        }
      );
    }
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Mock upload progress animation while backend processes
  useEffect(() => {
    if (isUploading && addFileMutation.isPending) {
      const duration = 1500; // 1.5 seconds
      const intervalTime = 30; // Update every 30ms for smooth animation
      const steps = duration / intervalTime;
      const increment = 95 / steps; // Animate to 95%, then complete to 100% on success
      let currentProgress = 0;

      const interval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 95) {
          setUploadProgress(95);
          clearInterval(interval);
        } else {
          setUploadProgress(currentProgress);
        }
      }, intervalTime);

      return () => clearInterval(interval);
    }
  }, [isUploading, addFileMutation.isPending]);

  const handleUploadClick = () => {
    document.getElementById('file-input')?.click();
  };

  const handleCopyLink = (fileId: bigint, index: number) => {
    const link = `https://fileshare.example.com/${fileId}`;
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = async (fileId: bigint, fileName: string) => {
    try {
      // Fetch the actual file content from backend
      const result = await getFileContentMutation.mutateAsync(fileId);
      
      // Convert Uint8Array to Blob - create a new Uint8Array to ensure proper typing
      const blob = new Blob([new Uint8Array(result.content)], { type: 'application/octet-stream' });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download started!', {
        description: `Downloading ${result.name}`
      });
    } catch (error) {
      toast.error('Failed to download file', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Download error:', error);
    }
  };

  const handleDeleteClick = (fileId: bigint) => {
    setFileToDelete(fileId);
  };

  const handleConfirmDelete = () => {
    if (fileToDelete !== null) {
      // Note: Backend doesn't have delete functionality yet
      toast.error('Delete functionality not yet implemented in backend');
      setFileToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setFileToDelete(null);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return FileText;
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext || '')) return Image;
    return File;
  };

  const formatFileSize = (bytes: bigint) => {
    const kb = Number(bytes) / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/5">
        {/* Background Pattern */}
        <div 
          className="fixed inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'url(/assets/generated/background-pattern.dim_1920x1080.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Header */}
        <header className="relative z-10 border-b border-border/40 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                <Cloud className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                CloudStore
              </h1>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            <Card className="border-2 border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
              <div className="p-12 md:p-16 flex flex-col items-center text-center space-y-8">
                {/* Icon */}
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-xl">
                    <img 
                      src="/assets/generated/upload-icon-transparent.dim_64x64.png" 
                      alt="Upload" 
                      className="w-16 h-16"
                    />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-3">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Upload Your Files
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Securely store and manage your files in the cloud. Click the button below to get started.
                  </p>
                </div>

                {/* Upload Button */}
                <div className="pt-4">
                  <input
                    id="file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    multiple={false}
                  />
                  <Button
                    size="lg"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileUp className="w-6 h-6 mr-3" />
                        Choose File to Upload
                      </>
                    )}
                  </Button>
                </div>

                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="pt-2 w-full max-w-md animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Uploading...</span>
                        <span className="text-primary font-semibold">{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="pt-8 w-full">
                  <h3 className="text-lg font-semibold mb-4 text-left">Your Files</h3>
                  {isLoadingFiles ? (
                    <div className="p-8 rounded-lg bg-accent/20 border border-border/30 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Loading files...</p>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="p-8 rounded-lg bg-accent/20 border border-border/30 text-center">
                      <p className="text-sm text-muted-foreground">No files uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file, index) => {
                        const IconComponent = getFileIcon(file.name);
                        return (
                          <div
                            key={file.id.toString()}
                            className="p-4 rounded-lg bg-accent/30 border border-border/40 flex items-center gap-3 hover:bg-accent/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 px-3"
                                  >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Share
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-semibold text-sm mb-1">Share Link</h4>
                                      <p className="text-xs text-muted-foreground">
                                        Anyone with this link can access the file
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 p-2 rounded-md bg-accent/50 border border-border/50">
                                        <p className="text-xs font-mono truncate">
                                          https://fileshare.example.com/{file.id.toString()}
                                        </p>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyLink(file.id, index)}
                                        className="flex-shrink-0"
                                      >
                                        {copiedIndex === index ? (
                                          <Check className="w-4 h-4" />
                                        ) : (
                                          <Copy className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3"
                                onClick={() => handleDownload(file.id, file.name)}
                                disabled={getFileContentMutation.isPending}
                              >
                                {getFileContentMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                Download
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteClick(file.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                      <Cloud className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">Cloud Storage</h3>
                    <p className="text-xs text-muted-foreground">Secure cloud-based file storage</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                      <FileUp className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">Easy Upload</h3>
                    <p className="text-xs text-muted-foreground">Simple one-click file upload</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm">Fast & Reliable</h3>
                    <p className="text-xs text-muted-foreground">Quick and dependable service</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-border/40 backdrop-blur-sm bg-background/80">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2025. Built with love using{' '}
              <a 
                href="https://caffeine.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </footer>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={fileToDelete !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster position="top-center" />
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FileStorageApp />
    </QueryClientProvider>
  );
}

export default App;
