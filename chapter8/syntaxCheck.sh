#!/bin/sh
valid="TRUE"
for f in ../chapter2/*.json
do
  ./syntax.sh $f >nul
  if [ $? -eq 1 ]
  then
    echo File: $f invalid
    valid="FALSE"
  else
    echo File: $f valid
  fi
done

if [ $valid -eq "TRUE" ]
then
  echo All files valid.
  exit 0
else
  exit 1
fi
