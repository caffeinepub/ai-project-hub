import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Artifact,
  Category,
  Language,
  Project,
  Revision,
  Status,
} from "../backend.d";
import { useActor } from "./useActor";

// ── Query Keys ──────────────────────────────────────────────
export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: bigint) => ["projects", id.toString()] as const,
};

// ── Read Queries ─────────────────────────────────────────────

export function useGetProjects() {
  const { actor, isFetching } = useActor();
  return useQuery<Project[]>({
    queryKey: projectKeys.all,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProjects();
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetProject(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Project | null>({
    queryKey: projectKeys.detail(id),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProject(id);
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Mutations ────────────────────────────────────────────────

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      category,
      description,
    }: {
      name: string;
      category: Category;
      description: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createProject(name, category, description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Failed to create project: ${message}`);
    },
  });
}

export function useUpdateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      category,
      status,
      description,
      notes,
    }: {
      id: bigint;
      name: string;
      category?: Category | null;
      status?: Status | null;
      description?: string | null;
      notes?: string | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateProject(
        id,
        name,
        category ?? null,
        status ?? null,
        description ?? null,
        notes ?? null,
      );
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.all });
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
      }
    },
    onError: () => {
      toast.error("Failed to update project");
    },
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteProject(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project deleted");
    },
    onError: () => {
      toast.error("Failed to delete project");
    },
  });
}

export function useAddGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      text,
    }: {
      projectId: bigint;
      text: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addGoal(projectId, text);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
    onError: () => {
      toast.error("Failed to add goal");
    },
  });
}

export function useToggleGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      goalId,
    }: {
      projectId: bigint;
      goalId: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.toggleGoal(projectId, goalId);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

export function useDeleteGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      goalId,
    }: {
      projectId: bigint;
      goalId: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteGoal(projectId, goalId);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
    onError: () => {
      toast.error("Failed to delete goal");
    },
  });
}

export function useAddMilestone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      title,
    }: {
      projectId: bigint;
      title: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addMilestone(projectId, title);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
    onError: () => {
      toast.error("Failed to add milestone");
    },
  });
}

export function useToggleMilestone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
    }: {
      projectId: bigint;
      milestoneId: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.toggleMilestone(projectId, milestoneId);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
  });
}

export function useDeleteMilestone() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
    }: {
      projectId: bigint;
      milestoneId: bigint;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteMilestone(projectId, milestoneId);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: projectKeys.detail(data.id) });
        qc.invalidateQueries({ queryKey: projectKeys.all });
      }
    },
    onError: () => {
      toast.error("Failed to delete milestone");
    },
  });
}

// ── Artifact Query Keys ───────────────────────────────────────
export const artifactKeys = {
  byProject: (projectId: bigint) =>
    ["artifacts", projectId.toString()] as const,
  detail: (id: bigint) => ["artifact", id.toString()] as const,
  revisions: (artifactId: bigint) =>
    ["revisions", artifactId.toString()] as const,
};

// ── Artifact Queries ──────────────────────────────────────────

export function useGetArtifacts(projectId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Artifact[]>({
    queryKey: artifactKeys.byProject(projectId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getArtifacts(projectId);
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetArtifact(id: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Artifact | null>({
    queryKey: artifactKeys.detail(id),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getArtifact(id);
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

export function useGetRevisions(artifactId: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Revision[]>({
    queryKey: artifactKeys.revisions(artifactId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRevisions(artifactId);
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: 1000,
  });
}

// ── Artifact Mutations ────────────────────────────────────────

export function useCreateArtifact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      filename,
      language,
      content,
    }: {
      projectId: bigint;
      filename: string;
      language: Language;
      content: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createArtifact(projectId, filename, language, content);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({
        queryKey: artifactKeys.byProject(data.projectId),
      });
    },
    onError: () => {
      toast.error("Failed to create file");
    },
  });
}

export function useUpdateArtifact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      filename,
      language,
      content,
    }: {
      id: bigint;
      filename?: string | null;
      language?: Language | null;
      content?: string | null;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateArtifact(
        id,
        filename ?? null,
        language ?? null,
        content ?? null,
      );
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: artifactKeys.detail(data.id) });
        qc.invalidateQueries({
          queryKey: artifactKeys.byProject(data.projectId),
        });
      }
    },
    onError: () => {
      toast.error("Failed to save file");
    },
  });
}

export function useDeleteArtifact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      projectId: _projectId,
    }: { id: bigint; projectId: bigint }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteArtifact(id);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: artifactKeys.byProject(variables.projectId),
      });
      toast.success("File deleted");
    },
    onError: () => {
      toast.error("Failed to delete file");
    },
  });
}

export function usePublishArtifact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.publishArtifact(id);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: artifactKeys.detail(data.id) });
        qc.invalidateQueries({
          queryKey: artifactKeys.byProject(data.projectId),
        });
        toast.success("Published! Your file is now live.");
      }
    },
    onError: () => {
      toast.error("Failed to publish");
    },
  });
}

export function useUnpublishArtifact() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.unpublishArtifact(id);
    },
    onSuccess: (data) => {
      if (data) {
        qc.invalidateQueries({ queryKey: artifactKeys.detail(data.id) });
        qc.invalidateQueries({
          queryKey: artifactKeys.byProject(data.projectId),
        });
        toast.success("Unpublished");
      }
    },
    onError: () => {
      toast.error("Failed to unpublish");
    },
  });
}

export function useAddRevision() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      artifactId,
      instruction,
      previousContent,
    }: {
      artifactId: bigint;
      instruction: string;
      previousContent: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addRevision(artifactId, instruction, previousContent);
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: artifactKeys.revisions(variables.artifactId),
      });
    },
    onError: () => {
      toast.error("Failed to save revision");
    },
  });
}

export function useCloneProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (project: Project) => {
      if (!actor) throw new Error("Not authenticated");
      // Fetch artifacts in parallel with creating new project
      const [sourceArtifacts, newProject] = await Promise.all([
        actor.getArtifacts(project.id),
        actor.createProject(
          `Copy of ${project.name}`,
          project.category,
          project.description,
        ),
      ]);
      // Copy notes if present
      if (project.notes) {
        await actor.updateProject(
          newProject.id,
          newProject.name,
          null,
          null,
          null,
          project.notes,
        );
      }
      // Copy goals sequentially
      for (const goal of project.goals) {
        await actor.addGoal(newProject.id, goal.text);
      }
      // Copy milestones sequentially
      for (const ms of project.milestones) {
        await actor.addMilestone(newProject.id, ms.title);
      }
      // Copy artifacts sequentially
      for (const art of sourceArtifacts) {
        await actor.createArtifact(
          newProject.id,
          art.filename,
          art.language,
          art.content,
        );
      }
      return newProject;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      toast.success("Project cloned!");
    },
    onError: () => {
      toast.error("Failed to clone project");
    },
  });
}
