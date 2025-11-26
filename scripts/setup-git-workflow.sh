#!/bin/bash

# Setup Git Workflow untuk Project
# Initialize develop branch dan setup workflow

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "${BLUE}🌳 Setting up Git Workflow...${NC}"
echo ""

# Check if we're in a git repo
if [ ! -d ".git" ]; then
    echo "${YELLOW}⚠️  Not a git repository. Initializing...${NC}"
    git init
    echo "${GREEN}✅ Git repository initialized${NC}"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "${BLUE}Current branch: ${CURRENT_BRANCH}${NC}"

# Check if develop branch exists
if git show-ref --verify --quiet refs/heads/develop; then
    echo "${GREEN}✅ develop branch already exists${NC}"
else
    echo "${YELLOW}📝 Creating develop branch...${NC}"
    
    # Create develop from current branch
    git checkout -b develop
    
    # Push to remote if remote exists
    if git remote | grep -q origin; then
        echo "${YELLOW}📤 Pushing develop to origin...${NC}"
        git push -u origin develop
        echo "${GREEN}✅ develop branch created and pushed${NC}"
    else
        echo "${YELLOW}⚠️  No remote 'origin' found. develop branch created locally.${NC}"
        echo "${YELLOW}   Run: git push -u origin develop${NC}"
    fi
fi

echo ""
echo "${GREEN}✅ Git Workflow Setup Complete!${NC}"
echo ""
echo "${BLUE}📋 Next Steps:${NC}"
echo ""
echo "1. ${YELLOW}Create feature branch:${NC}"
echo "   git checkout develop"
echo "   git pull origin develop"
echo "   git checkout -b feature/your-feature-name"
echo ""
echo "2. ${YELLOW}Develop & commit:${NC}"
echo "   git add ."
echo "   git commit -m 'feat: your feature description'"
echo ""
echo "3. ${YELLOW}Push & create PR:${NC}"
echo "   git push origin feature/your-feature-name"
echo "   # Create PR: feature/your-feature-name → develop"
echo ""
echo "4. ${YELLOW}After PR approved, merge to develop${NC}"
echo ""
echo "${BLUE}📚 See GIT_WORKFLOW_GUIDE.md for complete workflow${NC}"

