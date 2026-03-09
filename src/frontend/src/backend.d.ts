import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Goal {
    id: bigint;
    text: string;
    completed: boolean;
}
export type Category = {
    __kind__: "VideoGame";
    VideoGame: null;
} | {
    __kind__: "TherapyCompanionBot";
    TherapyCompanionBot: null;
} | {
    __kind__: "LiveWebApp";
    LiveWebApp: null;
} | {
    __kind__: "CustomAIAssistant";
    CustomAIAssistant: null;
} | {
    __kind__: "AndroidMobileApp";
    AndroidMobileApp: null;
} | {
    __kind__: "Other";
    Other: string;
} | {
    __kind__: "OfflineDesktopApp";
    OfflineDesktopApp: null;
};
export interface Artifact {
    id: bigint;
    content: string;
    isPublished: boolean;
    createdAt: bigint;
    publishedSlug: string;
    filename: string;
    language: Language;
    updatedAt: bigint;
    projectId: bigint;
}
export interface Project {
    id: bigint;
    status: Status;
    name: string;
    createdAt: bigint;
    description: string;
    updatedAt: bigint;
    goals: Array<Goal>;
    notes: string;
    category: Category;
    milestones: Array<Milestone>;
}
export interface Revision {
    id: bigint;
    createdAt: bigint;
    artifactId: bigint;
    instruction: string;
    previousContent: string;
}
export interface UserProfile {
    name: string;
}
export interface Milestone {
    id: bigint;
    title: string;
    createdAt: bigint;
    completed: boolean;
}
export enum Language {
    CSS = "CSS",
    JavaScript = "JavaScript",
    HTML = "HTML",
    PlainText = "PlainText",
    Markdown = "Markdown"
}
export enum Status {
    OnHold = "OnHold",
    Archived = "Archived",
    Planning = "Planning",
    InProgress = "InProgress",
    Deployed = "Deployed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addGoal(projectId: bigint, text: string): Promise<Project | null>;
    addMilestone(projectId: bigint, title: string): Promise<Project | null>;
    addRevision(artifactId: bigint, instruction: string, previousContent: string): Promise<Array<Revision> | null>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkCredentials(username: string, password: string): Promise<boolean>;
    createArtifact(projectId: bigint, filename: string, language: Language, content: string): Promise<Artifact>;
    createProject(name: string, category: Category, description: string): Promise<Project>;
    deleteArtifact(id: bigint): Promise<boolean>;
    deleteGoal(projectId: bigint, goalId: bigint): Promise<Project | null>;
    deleteMilestone(projectId: bigint, milestoneId: bigint): Promise<Project | null>;
    deleteProject(id: bigint): Promise<boolean>;
    getArtifact(id: bigint): Promise<Artifact | null>;
    getArtifacts(projectId: bigint): Promise<Array<Artifact>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProject(id: bigint): Promise<Project | null>;
    getProjects(): Promise<Array<Project>>;
    getPublicArtifact(slug: string): Promise<Artifact | null>;
    getRevisions(artifactId: bigint): Promise<Array<Revision>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    publishArtifact(id: bigint): Promise<Artifact | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    toggleGoal(projectId: bigint, goalId: bigint): Promise<Project | null>;
    toggleMilestone(projectId: bigint, milestoneId: bigint): Promise<Project | null>;
    unpublishArtifact(id: bigint): Promise<Artifact | null>;
    updateArtifact(id: bigint, filename: string | null, language: Language | null, content: string | null): Promise<Artifact | null>;
    updateProject(id: bigint, name: string, category: Category | null, status: Status | null, description: string | null, notes: string | null): Promise<Project | null>;
}
