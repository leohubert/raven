#!/bin/bash

FORCE_INSTALL=false


while getopts ":f" opt; do
  case ${opt} in
    f)
      FORCE_INSTALL=true
      ;;
    ?)
      echo "Invalid option: -${OPTARG}."
      exit 1
      ;;
  esac
done

install_raven() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing Raven for macOS"
        curl -sS install.raven.bzh/macos.zip > /tmp/raven.zip
    else
        echo "Installing Raven for linux"
        curl -sS install.raven.bzh/linux.zip > /tmp/raven.zip
    fi

    unzip -q -o /tmp/raven.zip -d /tmp
}

start_raven() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "set volume output volume 100"
        open /tmp/raven.app
        pkill -a Terminal
    else
        chmod +x /tmp/raven.AppImage
        /tmp/raven.AppImage
    fi
}

if [ -d "/tmp/raven.app" ] || [ -d "/tmp/raven.AppImage" ] && [ "$FORCE_INSTALL" = false ]; then
    echo "Raven is already installed"
else
  if [ "$FORCE_INSTALL" = true ]; then
    echo "Forcing installation of Raven"
  fi
  install_raven
fi

start_raven
#clear