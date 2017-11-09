#!/bin/bash

function try {
  echo "Running: $@"
  "$@"
  local status=$?
  if [ $status -ne 0 ]; then
      echo "!!!Error!!!" >&2
      exit $status
  fi
  return $status
}

USERNAME="rodri042"
BRANCH="bower"
echo "Deploying to $BRANCH branch..."

git branch -D $BRANCH
git remote add deploy https://$USERNAME:$GH_TOKEN@github.com/gobstones/gobstones-interpreter.git
try git fetch deploy
try git add lib -f
try git stash
try git checkout deploy/$BRANCH
try git checkout -b $BRANCH
try git rm -r lib/
try git stash pop
git commit -m "Deploy @ $(date +'%d/%m/%Y')"
try git push -f deploy $BRANCH
