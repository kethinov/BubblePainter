nw=0.9.2

cd "`dirname "$0"`/../../"

hash npm 2>/dev/null || {
  echo >&2 "You must install Node.js and npm to run this program: http://nodejs.org"
  exit 1
}

hash nodemon 2>/dev/null || {
  echo "You must install nodemon run this program. Please enter your password to install nodemon:";
  sudo npm install -g nodemon
}

if [ ! -d "app/node_modules" ]; then
  cd app
  mv package.json package.json.backup
  mv .package.npm.json package.json
  npm install
  mv package.json .package.npm.json
  mv package.json.backup package.json
  cd ..
fi

if [ ! -d "dev/mac/node-webkit-v$nw-osx-ia32" ]; then
  echo "Downloading node-webkit v$nw development environment..."
  curl -sS http://dl.node-webkit.org/v$nw/node-webkit-v$nw-osx-ia32.zip > nw.zip
  mkdir node-webkit-v$nw-osx-ia32
  unzip nw.zip -d node-webkit-v$nw-osx-ia32/
  rm nw.zip
  mv node-webkit-v$nw-osx-ia32 dev/mac/
fi

if [ ! -d "build" ]; then
  mkdir build
fi

rm -rf "build/Bubble Painter.app"
cp -R dev/mac/node-webkit-v$nw-osx-ia32/node-webkit.app build/
cp -R app build/node-webkit.app/Contents/Resources/
mv build/node-webkit.app/Contents/Resources/app build/node-webkit.app/Contents/Resources/app.nw
cp dev/mac/Info.plist build/node-webkit.app/Contents/

mkdir appicon.iconset
sips -z 16 16     dev/appicon.png --out appicon.iconset/icon_16x16.png
sips -z 32 32     dev/appicon.png --out appicon.iconset/icon_16x16@2x.png
sips -z 32 32     dev/appicon.png --out appicon.iconset/icon_32x32.png
sips -z 64 64     dev/appicon.png --out appicon.iconset/icon_32x32@2x.png
sips -z 128 128   dev/appicon.png --out appicon.iconset/icon_128x128.png
sips -z 256 256   dev/appicon.png --out appicon.iconset/icon_128x128@2x.png
sips -z 256 256   dev/appicon.png --out appicon.iconset/icon_256x256.png
sips -z 512 512   dev/appicon.png --out appicon.iconset/icon_256x256@2x.png
sips -z 512 512   dev/appicon.png --out appicon.iconset/icon_512x512.png
cp dev/appicon.png appicon.iconset/icon_512x512@2x.png
iconutil -c icns appicon.iconset
rm -R appicon.iconset
mv appicon.icns build/node-webkit.app/Contents/Resources/
mv appicon.icns build/node-webkit.app/Contents/Resources/nw.icns

mv build/node-webkit.app "build/Bubble Painter.app"