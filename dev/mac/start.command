cd "`dirname "$0"`/../"

nw=$(cat nwversion.txt)

cd "`dirname "$0"`/../../"

hash npm 2>/dev/null || {
  echo >&2 "You must install Node.js and npm to run this program: http://nodejs.org"
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

if [ ! -d "dev/mac/node-webkit-v$nw-osx-x64" ]; then
  echo "Downloading nw.js v$nw development environment..."
  curl -sS http://dl.nwjs.io/v$nw/node-webkit-v$nw-osx-x64.zip > nw.zip
  unzip nw.zip -d .
  rm nw.zip
  mv node-webkit-v$nw-osx-x64 dev/mac/
fi

./dev/mac/node-webkit-v$nw-osx-x64/node-webkit.app/Contents/MacOS/node-webkit app/