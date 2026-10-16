# Repository instructions

This repository contains the `resume-builder` skill. The complete, user-facing
workflow is documented in `SKILL.md`; keep that file self-contained.

## Development rules

- Keep the skill implementation free of real personal information.
- User data belongs in `profiles/` and generated resumes belong in `output/`;
  both are ignored by Git.
- Do not modify `templates/resume.cls` unless explicitly requested.
- Keep scripts deterministic and preserve their non-zero failure behavior.
- When changing the workflow, update `SKILL.md`, `README.md`, and related
  contracts together.
