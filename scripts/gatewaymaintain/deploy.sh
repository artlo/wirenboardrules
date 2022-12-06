#!/bin/bash

if [ -z $1 ]; then
  echo "Remote server address is needed"
  exit 1
fi

WB="$1"
DEPLOY_DIR="deploy"

tmpdir=$(mktemp -d)

echo "TEMP $tmpdir"

tar -czvf $tmpdir/deploy.tar.gz init.d logrotate.conf network_gateway_maintain.sh network_routes.sh

ssh root@$WB "mkdir -p ~/$DEPLOY_DIR"
scp $tmpdir/deploy.tar.gz root@$WB:$DEPLOY_DIR/deploy.tar.gz
scp remote_deploy.sh root@$WB:$DEPLOY_DIR/remote_deploy.sh
ssh root@$WB "chmod 700 ~/$DEPLOY_DIR/remote_deploy.sh; cd $DEPLOY_DIR; ./remote_deploy.sh"

rm -r $tmpdir
