#!/bin/sh
set -e

echo "Publishing website"

git reset --hard
git checkout website
yarn install
yarn upgrade ebnf2railroad
git add package.json yarn.lock
git commit -m 'Deploy Website'
git push origin website

