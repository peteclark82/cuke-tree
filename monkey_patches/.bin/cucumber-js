#!/bin/sh
basedir=`dirname "$0"`

case `uname` in
    *CYGWIN*) basedir=`cygpath -w "$basedir"`;;
esac

if [ -x "$basedir/node" ]; then
  "$basedir/node"  "$basedir/../cucumber/bin/cucumber.js" "$@"
  ret=$?
else 
  node  "$basedir/../cucumber/bin/cucumber.js" "$@"
  ret=$?
fi
exit $ret
