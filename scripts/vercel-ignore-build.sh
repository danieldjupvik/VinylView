#!/bin/bash

# Vercel Ignored Build Step
# https://vercel.com/docs/projects/overview#ignored-build-step
#
# This script determines whether Vercel should build a commit.
# Exit 1 = build, Exit 0 = skip build
#
# Strategy:
# - Preview deployments (PRs): Always build so reviewers can test
# - Production deployments (main): Only build on release commits

echo "Checking if this commit should trigger a Vercel build..."
echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Always build preview deployments (PRs)
# This allows reviewers to test feature branches
if [ "$VERCEL_ENV" = "preview" ]; then
  echo "✓ Preview deployment - proceeding with build"
  exit 1
fi

# For production deployments, only build on release commits
if [ "$VERCEL_ENV" = "production" ]; then
  COMMIT_MSG=$(git log -1 --pretty=%B)

  # Check if this is a release-please release commit
  # Release-please creates commits like "chore(main): release 0.2.0"
  if echo "$COMMIT_MSG" | grep -qE "^chore\(main\): release"; then
    echo "✓ Release commit detected - proceeding with production build"
    exit 1
  fi

  # Check if package.json version was changed in this commit
  # This catches release-please version bumps
  if git diff HEAD~1 HEAD --name-only 2>/dev/null | grep -q "package.json"; then
    VERSION_CHANGED=$(git diff HEAD~1 HEAD -- package.json | grep -E '^\+.*"version"' || true)
    if [ -n "$VERSION_CHANGED" ]; then
      echo "✓ Version bump detected in package.json - proceeding with production build"
      exit 1
    fi
  fi

  # Check for release tags
  TAGS=$(git tag --points-at HEAD 2>/dev/null || true)
  if echo "$TAGS" | grep -qE "^v[0-9]+\.[0-9]+"; then
    echo "✓ Release tag detected - proceeding with production build"
    exit 1
  fi

  echo "✗ Not a release commit - skipping production build"
  echo "  Production deploys only when release-please PR is merged"
  exit 0
fi

# For any other environment (e.g., development), build
echo "✓ Non-production environment - proceeding with build"
exit 1
