#!/bin/bash

# After creating a repository on GitHub, replace YOUR_GITHUB_USERNAME with your username
# and REPOSITORY_NAME with your repository name

# Add the remote origin
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/REPOSITORY_NAME.git

# Push to GitHub
git push -u origin main

echo "Code pushed to GitHub successfully!"