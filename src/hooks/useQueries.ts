import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { FileMetadata } from '../backend';

// Hook to fetch all files from backend
export function useGetFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<FileMetadata[]>({
    queryKey: ['files'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

// Hook to add a new file to backend
export function useAddFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, size }: { name: string; size: bigint }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addFile(name, size);
    },
    onSuccess: () => {
      // Invalidate and refetch files list
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

// Hook to fetch file content from backend
export function useGetFileContent() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (fileId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      const result = await actor.getFileContent(fileId);
      if (!result) {
        throw new Error('File not found');
      }
      return { name: result[0], content: result[1] };
    },
  });
}
