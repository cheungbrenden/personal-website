---
title: 'Debugging ECS Health Checks at 2 AM'
pubDate: 2026-03-05
description: 'The story of a subtle race condition in our container orchestrator health check reconciliation loop, and the map-based pool pattern that fixed it.'
tags: ['aws', 'debugging', 'ecs']
---

It's 2 AM on a Tuesday. PagerDuty fires. Half our ECS tasks are showing as unhealthy despite the containers running fine. The health check endpoint returns 200. The load balancer agrees everything is healthy. But ECS keeps killing and restarting containers in an infinite loop.

This is the story of a race condition that took 6 hours to find and 20 minutes to fix.

## The Symptoms

Our container orchestrator manages a pool of ECS tasks. It periodically reconciles the pool — checking health, replacing dead tasks, and signaling waiters when capacity is available.

The symptoms were confusing:

1. Tasks would start healthy
2. After 5-10 minutes, the orchestrator would mark them unhealthy
3. ECS would drain and replace them
4. New tasks would start healthy
5. Goto step 2

The application logs showed nothing wrong. Health check endpoints returned 200. The issue was in our orchestrator, not in the containers.

## Finding the Bug

The reconciliation loop ran every 30 seconds. It would:

1. Fetch the current list of ECS tasks from the API
2. Compare against our internal pool
3. Mark tasks as healthy/unhealthy
4. Signal waiters if new capacity was available

The bug was in step 4. We were using a **channel-based** signaling pattern:

```go
// The old pattern — channel-based waiter signaling
func (p *Pool) signalWaiters() {
    select {
    case p.ready <- struct{}{}:
    default:
    }
}
```

This looks fine, but it had a subtle problem. When multiple reconciliation cycles ran close together (which happened under load), the channel would get closed and recreated. A goroutine reading from the old channel would never receive the signal.

## The Fix

We replaced the channel-based pool with a **map-based pool protected by a mutex**:

```go
type Pool struct {
    mu      sync.RWMutex
    tasks   map[string]*Task
    waiters []chan struct{}
}

func (p *Pool) signalWaiters() {
    p.mu.Lock()
    defer p.mu.Unlock()
    for _, ch := range p.waiters {
        select {
        case ch <- struct{}{}:
        default:
        }
    }
    p.waiters = nil
}
```

Each waiter gets its own channel. Signaling iterates through all waiters. No channel gets closed and recreated. No lost signals.

## Lessons Learned

1. **Channels are not always the answer.** Go's channels are powerful, but they add complexity when you need to signal multiple consumers. Sometimes a mutex and a slice is simpler and more correct.

2. **Race conditions hide under load.** This bug never appeared in development or staging. It only manifested in production under sustained load because that's the only time multiple reconciliation cycles would overlap.

3. **Instrument your orchestrator, not just your application.** We had extensive logging in our containers but almost none in the orchestrator itself. Adding structured logging with timestamps to the reconciliation loop is what finally revealed the timing issue.

4. **2 AM bugs teach you the most.** There's nothing quite like the clarity that comes from debugging production at 2 AM. You learn to focus on what matters and ignore everything else.
