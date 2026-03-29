# Workspace Agent Notes

- After using Playwright MCP, always clean up the browser session before finishing the task or moving on to unrelated work.
- Preferred cleanup action: call the Playwright browser close tool (`browser_close`) once browser-driven verification or interaction is done.
- After implementing a clearly scoped feature, continue through commit and push to `main` unless the user gives a different delivery instruction.
- Commit messages must be written in Korean as a single sentence, start with a work-type prefix such as `feat`, `bugfix`, or `chore`, and clearly summarize the implemented change.
- Run `git add`, `git commit`, and `git push` autonomously without asking for separate conversational permission when they are the natural completion steps for the current task.
