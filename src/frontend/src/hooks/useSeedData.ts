import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Status } from "../backend.d";
import { useActor } from "./useActor";
import { projectKeys } from "./useQueries";

const SEED_KEY = "ai_hub_seeded_v1";

export function useSeedData(isAuthenticated: boolean) {
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();
  const seeding = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !actor || isFetching || seeding.current) return;
    if (localStorage.getItem(SEED_KEY)) return;

    seeding.current = true;

    const run = async () => {
      try {
        const existing = await actor.getProjects();
        if (existing.length > 0) {
          localStorage.setItem(SEED_KEY, "1");
          return;
        }

        const [nexus, pixel, calm] = await Promise.all([
          actor.createProject(
            "NexusChat",
            { __kind__: "CustomAIAssistant", CustomAIAssistant: null },
            "A customer support AI assistant with natural language understanding and multi-channel integration.",
          ),
          actor.createProject(
            "PixelForge",
            { __kind__: "VideoGame", VideoGame: null },
            "Procedurally generated 2D dungeon crawler with AI-powered enemies and adaptive difficulty.",
          ),
          actor.createProject(
            "CalmCompanion",
            { __kind__: "TherapyCompanionBot", TherapyCompanionBot: null },
            "A mental wellness companion bot for daily mood tracking, journaling prompts, and emotional support.",
          ),
        ]);

        // Update statuses
        await Promise.all([
          actor.updateProject(
            nexus.id,
            nexus.name,
            null,
            Status.Deployed,
            null,
            "Launched to production with 98.7% uptime. Currently handling 2,400 support tickets per day.",
          ),
          actor.updateProject(
            pixel.id,
            pixel.name,
            null,
            Status.InProgress,
            null,
            "Combat system complete. Working on level generation and boss AI behavior trees.",
          ),
        ]);

        // Add some goals to CalmCompanion
        await actor.addGoal(
          calm.id,
          "Design conversation flow for mood check-ins",
        );
        await actor.addGoal(
          calm.id,
          "Build crisis resource database integration",
        );
        await actor.addMilestone(calm.id, "MVP therapy session prototype");

        localStorage.setItem(SEED_KEY, "1");
        qc.invalidateQueries({ queryKey: projectKeys.all });
      } catch (_e) {
        // Silent fail — seeding is best-effort
      } finally {
        seeding.current = false;
      }
    };

    void run();
  }, [isAuthenticated, actor, isFetching, qc]);
}
