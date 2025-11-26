# 🌳 Git Workflow untuk Aplikasi Besar

## 📋 Overview

Workflow yang digunakan aplikasi besar seperti Facebook, Google, Netflix untuk manage development dan production.

## 🌿 Branch Strategy (Git Flow)

```
main (production)
  │
  ├── develop (development/staging)
  │     │
  │     ├── feature/new-feature-1
  │     ├── feature/new-feature-2
  │     └── bugfix/fix-bug-1
  │
  └── hotfix/critical-fix
```

### Branch Types

1. **`main`** (Production)
   - ✅ Hanya code yang sudah tested & approved
   - ✅ Selalu stable & production-ready
   - ✅ Protected (tidak bisa push langsung)
   - ✅ Auto-deploy ke production

2. **`develop`** (Development/Staging)
   - ✅ Integration branch untuk semua features
   - ✅ Testing environment
   - ✅ Auto-deploy ke staging server
   - ✅ Merge dari feature branches

3. **`feature/*`** (Feature Development)
   - ✅ Setiap fitur baru punya branch sendiri
   - ✅ Nama: `feature/login-page`, `feature/payment-integration`
   - ✅ Merge ke `develop` setelah selesai
   - ✅ Delete setelah merge

4. **`bugfix/*`** (Bug Fixes)
   - ✅ Fix bugs di develop
   - ✅ Nama: `bugfix/fix-login-error`
   - ✅ Merge ke `develop`

5. **`hotfix/*`** (Critical Production Fixes)
   - ✅ Fix urgent di production
   - ✅ Branch dari `main`
   - ✅ Merge ke `main` DAN `develop`

## 🔄 Workflow Step-by-Step

### 1. Start Development

```bash
# Update develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-payment-method

# Develop your feature...
# Commit frequently
git add .
git commit -m "feat: add new payment method"
```

### 2. Push Feature Branch

```bash
# Push feature branch (safe - not production)
git push origin feature/new-payment-method

# Create Pull Request (PR) di GitHub/GitLab
# PR: feature/new-payment-method → develop
```

### 3. Code Review & Testing

- ✅ Team review code di PR
- ✅ Automated tests run
- ✅ Test di staging environment
- ✅ Fix issues jika ada

### 4. Merge ke Develop

```bash
# After PR approved, merge ke develop
# (biasanya via GitHub UI atau merge button)

# Update local
git checkout develop
git pull origin develop

# Delete feature branch (cleanup)
git branch -d feature/new-payment-method
```

### 5. Deploy ke Staging

```bash
# develop branch auto-deploy ke staging
# Test di staging: https://staging.nusaevent.com
```

### 6. Release ke Production

```bash
# Create release branch dari develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Final testing & bug fixes
# Merge ke main
git checkout main
git merge release/v1.2.0
git tag v1.2.0
git push origin main --tags

# Auto-deploy ke production
```

## 🚀 CI/CD Pipeline

### Continuous Integration (CI)

```yaml
# .github/workflows/ci.yml
on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  test:
    - Run tests
    - Lint code
    - Build check
    
  deploy-staging:
    if: branch == 'develop'
    - Deploy to staging
    
  deploy-production:
    if: branch == 'main'
    - Deploy to production
```

### Pipeline Flow

```
Feature Branch
    ↓
Push to GitHub
    ↓
CI: Run Tests ✅
    ↓
Create PR
    ↓
Code Review ✅
    ↓
Merge to develop
    ↓
CI: Deploy to Staging
    ↓
Test in Staging ✅
    ↓
Merge to main
    ↓
CI: Deploy to Production
```

## 📝 Commit Message Convention

### Format
```
type(scope): subject

body (optional)

footer (optional)
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Examples
```bash
feat(payment): add Xendit integration
fix(login): resolve authentication timeout
docs(api): update API documentation
refactor(wallet): optimize balance calculation
```

## 🛡️ Branch Protection Rules

### Main Branch
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ No direct pushes (must via PR)
- ✅ Require admin approval for production

### Develop Branch
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Allow force push (for emergency fixes)

## 🔥 Hotfix Workflow (Production Emergency)

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-payment-bug

# 2. Fix the bug
# ... fix code ...
git commit -m "fix(payment): resolve critical payment bug"

# 3. Test quickly
# ... test ...

# 4. Merge to main (production)
git checkout main
git merge hotfix/critical-payment-bug
git push origin main

# 5. Also merge to develop (keep in sync)
git checkout develop
git merge hotfix/critical-payment-bug
git push origin develop

# 6. Tag release
git checkout main
git tag v1.1.1-hotfix
git push origin v1.1.1-hotfix
```

## 📊 Environment Mapping

```
Branch          →  Environment      →  URL
─────────────────────────────────────────────
main            →  Production        →  https://nusaevent.com
develop         →  Staging           →  https://staging.nusaevent.com
feature/*       →  Preview/Dev       →  https://feature-xyz.preview.nusaevent.com
hotfix/*        →  Hotfix Testing    →  https://hotfix-xyz.test.nusaevent.com
```

## 🎯 Best Practices

### ✅ DO
- ✅ Always create feature branch dari `develop`
- ✅ Commit frequently dengan clear messages
- ✅ Keep branches small & focused
- ✅ Test before merging
- ✅ Use PR for code review
- ✅ Delete merged branches
- ✅ Tag releases

### ❌ DON'T
- ❌ Don't commit directly to `main`
- ❌ Don't commit directly to `develop` (use PR)
- ❌ Don't merge broken code
- ❌ Don't skip tests
- ❌ Don't force push to `main`
- ❌ Don't leave branches hanging

## 🔧 Setup untuk Project Ini

### 1. Initialize Git Flow

```bash
# Install git-flow (optional helper)
# macOS
brew install git-flow

# Or use manual Git commands (recommended)
```

### 2. Create Develop Branch

```bash
# If develop doesn't exist
git checkout -b develop
git push -u origin develop
```

### 3. Setup Branch Protection

**GitHub:**
1. Settings → Branches
2. Add rule for `main`:
   - Require pull request reviews
   - Require status checks
   - Include administrators
3. Add rule for `develop`:
   - Require pull request reviews
   - Allow force push (optional)

### 4. Setup CI/CD

**GitHub Actions:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          # Deploy commands
          
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # Deploy commands
```

## 📚 Real-World Examples

### Netflix
- **Main**: Production (millions of users)
- **Develop**: Staging (internal testing)
- **Feature branches**: Preview environments
- **Hotfix**: Emergency fixes (deploy in minutes)

### Facebook
- **Main**: Production
- **Release branches**: Versioned releases
- **Feature flags**: Enable/disable features without deploy

### Google
- **Trunk-based development**: Short-lived branches
- **Feature flags**: Gradual rollout
- **Canary deployments**: Test on small % users first

## 🎓 Summary

**Aplikasi Besar Workflow:**

1. **Develop** di feature branch
2. **Test** di local & staging
3. **Review** via Pull Request
4. **Merge** ke develop → staging
5. **Test** di staging
6. **Release** ke main → production
7. **Monitor** production

**Key Points:**
- ✅ Never push directly to main
- ✅ Always use branches
- ✅ Test before merge
- ✅ Use PR for review
- ✅ Deploy automatically via CI/CD

