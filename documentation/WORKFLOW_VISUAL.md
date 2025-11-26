# 🎯 Visual Workflow Guide

## 🌳 Branch Structure

```
                    main (PRODUCTION)
                    │
                    │ 🔥 Hotfix (emergency)
                    │
                    ├─────────────────┐
                    │                 │
            develop (STAGING)    release/v1.2.0
                    │
        ┌───────────┼───────────┐
        │           │           │
    feature/    feature/    bugfix/
    payment     login       error
```

## 🔄 Development Flow

```
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE FEATURE BRANCH                                │
│    git checkout develop                                  │
│    git pull origin develop                              │
│    git checkout -b feature/new-payment                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. DEVELOP & COMMIT                                     │
│    # Write code...                                       │
│    git add .                                             │
│    git commit -m "feat: add new payment"                │
│    git push origin feature/new-payment                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. CREATE PULL REQUEST                                  │
│    GitHub: feature/new-payment → develop                │
│    - Code review                                         │
│    - Automated tests                                     │
│    - Discussion                                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. MERGE TO DEVELOP                                     │
│    ✅ PR approved                                        │
│    ✅ Tests passed                                       │
│    ✅ Code reviewed                                      │
│    → Merge to develop                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 5. AUTO-DEPLOY TO STAGING                               │
│    CI/CD: develop branch → staging server                │
│    URL: https://staging.nusaevent.com                  │
│    - Test semua fitur                                    │
│    - Integration testing                                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 6. TEST IN STAGING                                      │
│    ✅ All features work                                 │
│    ✅ No bugs found                                     │
│    ✅ Performance OK                                     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 7. RELEASE TO PRODUCTION                                │
│    git checkout develop                                 │
│    git checkout -b release/v1.2.0                       │
│    # Final testing                                       │
│    git checkout main                                    │
│    git merge release/v1.2.0                             │
│    git tag v1.2.0                                       │
│    git push origin main --tags                          │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ 8. AUTO-DEPLOY TO PRODUCTION                            │
│    CI/CD: main branch → production server                │
│    URL: https://nusaevent.com                           │
│    - Monitor logs                                        │
│    - Check errors                                        │
└─────────────────────────────────────────────────────────┘
```

## 🚨 Hotfix Flow (Emergency)

```
PRODUCTION BUG DETECTED
        ↓
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE HOTFIX FROM MAIN                              │
│    git checkout main                                    │
│    git pull origin main                                 │
│    git checkout -b hotfix/critical-bug                  │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ 2. FIX & TEST                                           │
│    # Fix bug quickly                                    │
│    git commit -m "fix: critical bug"                    │
│    # Quick test                                         │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ 3. MERGE TO MAIN (PRODUCTION)                           │
│    git checkout main                                    │
│    git merge hotfix/critical-bug                        │
│    git push origin main                                 │
│    → Auto-deploy to production                          │
└─────────────────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────────────────┐
│ 4. ALSO MERGE TO DEVELOP (Keep in sync)                │
│    git checkout develop                                 │
│    git merge hotfix/critical-bug                        │
│    git push origin develop                              │
└─────────────────────────────────────────────────────────┘
```

## 📊 Environment Mapping

| Branch | Environment | URL | Purpose |
|--------|------------|-----|---------|
| `main` | Production | `https://nusaevent.com` | Live users |
| `develop` | Staging | `https://staging.nusaevent.com` | Testing |
| `feature/*` | Preview | `https://feature-xyz.preview.com` | Development |
| `hotfix/*` | Hotfix Test | `https://hotfix-xyz.test.com` | Emergency |

## 🎯 Real Example: Netflix

```
User reports: "Video won't play"
        ↓
Engineer creates: hotfix/video-playback
        ↓
Fix code (5 minutes)
        ↓
Test locally (2 minutes)
        ↓
Merge to main → Auto-deploy
        ↓
Deployed to production (10 minutes total)
        ↓
Monitor: Error rate drops
        ↓
Also merge to develop (keep in sync)
```

## 🎯 Real Example: Facebook

```
New feature: "Dark Mode"
        ↓
Create: feature/dark-mode
        ↓
Develop for 2 weeks
        ↓
PR → Code review (3 days)
        ↓
Merge to develop → Staging
        ↓
Test in staging (1 week)
        ↓
Merge to main → Production
        ↓
Feature flag: Enable for 1% users
        ↓
Monitor metrics
        ↓
Gradually increase: 5% → 25% → 100%
```

## 🔧 Setup untuk Project Ini

### Step 1: Initialize

```bash
# Run setup script
./scripts/setup-git-workflow.sh
```

### Step 2: Daily Workflow

```bash
# Morning: Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Work...
git add .
git commit -m "feat: my feature"

# Push (safe - not production)
git push origin feature/my-feature

# Create PR on GitHub
# Wait for review & approval

# After merge: Cleanup
git checkout develop
git pull origin develop
git branch -d feature/my-feature
```

### Step 3: Release

```bash
# When ready to release
git checkout develop
git checkout -b release/v1.2.0

# Final testing
# Fix any issues

# Merge to main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# Also update develop
git checkout develop
git merge release/v1.2.0
git push origin develop
```

## ⚡ Key Benefits

✅ **Safe Development** - Never break production
✅ **Code Review** - Team reviews before merge
✅ **Automated Testing** - Tests run automatically
✅ **Staging Environment** - Test before production
✅ **Rollback Easy** - Can revert if needed
✅ **Team Collaboration** - Multiple people work simultaneously
✅ **History Tracking** - See what changed when

## 🚫 Common Mistakes

❌ **Pushing directly to main** → Can break production
❌ **Skipping tests** → Bugs reach production
❌ **No code review** → Bad code gets merged
❌ **Long-lived branches** → Hard to merge
❌ **Forgetting to sync** → develop & main diverge

## ✅ Best Practices

✅ Always branch from develop
✅ Keep branches small & focused
✅ Commit frequently
✅ Write clear commit messages
✅ Test before merging
✅ Use PR for review
✅ Delete merged branches
✅ Tag releases

