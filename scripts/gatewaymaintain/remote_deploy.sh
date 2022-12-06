#!/bin/bash

tar -xf ~/deploy/deploy.tar.gz

cp network_routes.sh /etc/network_routes.sh
cp network_gateway_maintain.sh /usr/bin/network_gateway_maintain
cp init.d/network_gateway_maintain /etc/init.d/network_gateway_maintain
update-rc.d network_gateway_maintain defaults
systemctl daemon-reload
/etc/init.d/network_gateway_maintain stop
/etc/init.d/network_gateway_maintain start
cp logrotate.conf /etc/logrotate.d/network_gateway_maintain
logrotate /etc/logrotate.d/network_gateway_maintain

rm -r ../deploy

