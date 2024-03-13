#!/bin/bash

function install_raven() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installing Raven for macOS"
        curl -sS install.raven.bzh/macos.zip > /tmp/raven.zip
    else
        echo "Installing Raven for linux"
        curl -sS install.raven.bzh/linux.zip > /tmp/raven.zip
    fi

    unzip -q -o /tmp/raven.zip -d /tmp
}

function start_raven() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e "set volume output volume 100"
        open /tmp/raven.app
        pkill -a Terminal
    else
        chmod +x /tmp/raven/raven
        /tmp/raven/raven
    fi
}

if [ -d "/tmp/raven.app" ] || [ -d "/tmp/raven" ]; then
    echo "Raven is already installed"
else
    install_raven
fi

start_raven
#clear