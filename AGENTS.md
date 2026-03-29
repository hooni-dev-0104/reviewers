# Workspace Agent Notes

- After using Playwright MCP, always clean up the browser session before finishing the task or moving on to unrelated work.
- Preferred cleanup action: call the Playwright browser close tool (`browser_close`) once browser-driven verification or interaction is done.
- After implementing a clearly scoped feature, continue through commit and push to `main` unless the user gives a different delivery instruction.
