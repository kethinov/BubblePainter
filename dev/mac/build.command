cd "`dirname "$0"`/../"

nw=$(cat nwversion.txt)
nwa=$(cat nwarch.txt)
if [ "$nwa" = "64" ]; then
  nwa=x64
else
  nwa=ia32
fi
appname=$(cat appname.txt)

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

if [ ! -d "dev/mac/nwjs-v$nw-osx-$nwa" ]; then
  echo "Downloading nw.js v$nw development environment..."
  curl -sS http://dl.nwjs.io/v$nw/nwjs-v$nw-osx-$nwa.zip > nw.zip
  unzip nw.zip -d .
  rm nw.zip
  mv nwjs-v$nw-osx-$nwa dev/mac/
fi

if [ ! -d "build" ]; then
  mkdir build
fi

rm -rf "build/$appname.app"
cp -R dev/mac/nwjs-v$nw-osx-$nwa/nwjs.app build/
cp -R app build/nwjs.app/Contents/Resources/
mv build/nwjs.app/Contents/Resources/app build/nwjs.app/Contents/Resources/app.nw
cp dev/mac/Info.plist build/nwjs.app/Contents/

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
mv appicon.icns build/nwjs.app/Contents/Resources/
rm -rf appicon.icns build/nwjs.app/Contents/Resources/nw.icns

mv build/nwjs.app "build/$appname.app"