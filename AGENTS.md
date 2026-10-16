# Repository instructions

This repository contains the `xiaocai-resume` skill. The complete, user-facing
workflow is documented in `SKILL.md`; keep that file self-contained.

## Development rules

- Keep the skill implementation free of real personal information.
- User data belongs outside the skill repository. The default global profile
  location is `~/.agents/resume-builder/profiles/`; workspace-local profiles
  belong in `profiles/`, and generated resumes belong in `output/`. Workspace
  data directories are ignored by Git.
- Do not modify `templates/resume.cls` unless explicitly requested.
- `scripts/` is now a single cross-platform Node CLI (`scripts/resume.mjs`,
  standard library only) that replaces the old bash scripts; do not add bash
  wrappers or extra npm dependencies. Keep scripts deterministic and preserve
  their non-zero failure behavior.
- When changing the workflow, update `SKILL.md`, `README.md`, and related
  contracts together.
