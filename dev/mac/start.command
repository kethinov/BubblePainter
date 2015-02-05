cd "`dirname "$0"`/../"

nw=$(cat nwversion.txt)
nwa=$(cat nwarch.txt)
if [ "$nwa" = "64" ]; then
  nwa=x64
else
  nwa=ia32
fi

cd ..

hash npm 2>/dev/null || {
  echo >&2 "You must install npm to run this program: http://npmjs.org"
  exit 1
}

if [ ! -d "app/node_modules" ]; then
  cd app
  npm install
  cd ..
fi

hash bower 2>/dev/null || {
  echo >&2 "You must install bower to run this program: http://bower.io"
  exit 1
}

if [ ! -d "app/bower_components" ]; then
  cd app
  bower install
  cd ..
fi

if [ ! -d "dev/mac/node-webkit-v$nw-osx-$nwa" ]; then
  echo "Downloading nw.js v$nw development environment..."
  curl -sS http://dl.nwjs.io/v$nw/node-webkit-v$nw-osx-$nwa.zip > nw.zip
  unzip nw.zip -d .
  rm nw.zip
  mv node-webkit-v$nw-osx-$nwa dev/mac/
fi

./dev/mac/node-webkit-v$nw-osx-$nwa/node-webkit.app/Contents/MacOS/node-webkit app/