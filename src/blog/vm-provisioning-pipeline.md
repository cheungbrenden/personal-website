---
title: 'Building a VM Provisioning Pipeline from Scratch'
pubDate: 2026-04-08
description: 'How I designed a system that provisions Windows VMs with custom configurations, handles credential injection, and maintains security through automated hardening.'
tags: ['infrastructure', 'go', 'devops']
---

Setting up virtual machines manually is tedious. Setting them up at scale — with custom credentials, security hardening, and automated configuration — is a genuine engineering challenge. Here's how I built a provisioning pipeline that handles all of it.

## The Problem

Our team needed a way to spin up Windows VMs on demand. Each VM needed:

- Custom usernames and passwords injected at install time
- Automated security hardening (disable unnecessary services, configure firewall)
- A clean, reproducible base image
- Support for both local development and cloud deployment

We couldn't just use pre-built AMIs because every deployment had unique credential requirements.

## The Architecture

The solution centers around **custom ISO generation**. Instead of configuring VMs after they boot, we inject everything into the installation media itself.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Request    │───▶│  ISO Builder │───▶│  VM Create   │
│  (API call)  │    │  (Go binary) │    │ (VirtualBox) │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ autounattend │
                    │ SetupComplete│
                    │ credentials  │
                    └─────────────┘
```

The ISO builder takes a base Windows ISO and overlays three key files: an `autounattend.xml` for unattended installation, a `SetupComplete.cmd` for post-install hardening, and a credentials file that gets consumed and deleted after first boot.

## Key Decisions

**Why Go?** We needed a single binary that could run on any platform — the provisioning agent runs on developer machines, CI/CD pipelines, and production servers. Go's cross-compilation and static binaries made this trivial.

**Why custom ISOs instead of cloud-init?** Windows doesn't natively support cloud-init. While there are third-party implementations, injecting configuration at the ISO level gave us complete control and zero external dependencies.

**Why VirtualBox as the hypervisor?** For local development, VirtualBox is free and runs everywhere. The abstraction layer we built means swapping to KVM or Hyper-V for production is a configuration change, not a rewrite.

## Security Hardening

Every VM goes through an automated hardening process during `SetupComplete.cmd`:

1. Disable Remote Desktop (re-enabled only when needed)
2. Configure Windows Firewall with strict inbound rules
3. Disable unnecessary services (Bluetooth, Print Spooler, etc.)
4. Apply registry hardening for credential protection
5. Remove the credentials file after consumption

## Results

The pipeline provisions a fully hardened Windows VM in under 4 minutes. What used to be a 30-minute manual process with inevitable configuration drift is now a single API call.

## What I Learned

The biggest lesson was about **XML escaping**. Credentials with special characters (`&`, `<`, `>`) would break the `autounattend.xml` if not properly escaped. This caused silent installation failures that were incredibly hard to debug — the VM would just sit at the Windows setup screen with no error message.

Always validate your generated configuration files before injecting them into install media. A 5-line validation function saved us hours of debugging.
