---
name: n8n-automation
description: Build n8n automation workflows with webhooks, conditional logic, error handling, and scheduling. Use when designing or debugging n8n workflows.
---

# n8n Automation

## Workflow Design
1. Start with trigger (Webhook, Schedule, or Event)
2. Validate/transform input data
3. Core logic (API calls, data processing)
4. Error handling on every external call
5. Output/notification

## Key Nodes
- **Webhook** — trigger on HTTP request
- **HTTP Request** — call external APIs
- **IF** — conditional branching
- **Switch** — multi-branch routing
- **Code** — custom JavaScript/Python
- **Set** — transform data shape
- **Merge** — combine branches
- **Error Trigger** — catch workflow errors

## Error Handling
- Enable "Continue on Fail" for non-critical steps
- Use Error Trigger workflow for alerting
- Always log errors with context (workflow name, node, input data)
- Implement retry logic for transient API failures

## Best Practices
- Name nodes descriptively (not "HTTP Request 1")
- Use sticky notes to document workflow sections
- Test with sample data before activating
- Use environment variables for credentials, never hardcode
- Keep workflows focused — one workflow per concern
- Use sub-workflows for reusable logic

## Anti-Patterns
- Don't chain 50+ nodes — break into sub-workflows
- Don't skip error handling on API calls
- Don't use production credentials in test workflows
- Don't activate without testing the full happy + error paths
