# Job notifications

For long jobs, the agent runtime subscribes once and receives updates for its
own jobs. It can reconnect and read missed updates instead of polling every job.

```text
Agent submits a job → Provider records queued / running / terminal
                              ↓
                      Private event journal
                              ↓ SSE or replay
Agent runtime resumes → Reads final job → Downloads output → Verifies receipt
```

This optional contract works directly with a provider or through SPPA Hub.
The Hub is not required. Credentials, journal IDs and cursors belong to the
authority that issued them. The machine-readable declaration identifies that
authority and its retention limits.

The reference provider keeps events in memory. Hub keeps its events in SQLite.
Both advertise this distinction; a restart cannot silently reuse an old cursor
against a new journal. A disconnected agent runtime must reconnect to receive
updates. Notifications alone do not establish output quality or successful
verification.

Read the [exact specification](../../spec/job-notifications/0.1.0-draft.1/),
schemas and API binding. This is `sppa.job_notifications`, version
`0.1.0-draft.1`, an experimental extension to Core 0.1.1.
