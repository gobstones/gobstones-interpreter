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

git remote add deploy https://$USERNAME:$GH_TOKEN@github.com/gobstones/gobstones-interpreter.git
try git fetch deploy
try git checkout deploy/$BRANCH
try git checkout -b $BRANCH
try git add -f lib
try git commit -m "Deploy @ $(date +'%d/%m/%Y')"
try git push -f deploy $BRANCH
