#!/bin/bash

. /etc/network_routes.sh

OLDIF0=0
OLDIF1=0

LOG="/var/log/local/network_gateway_maintain"

log()
{
  echo `date "+%Y-%m-%d %H:%M:%S"` $1 >> $LOG
}

restart_gsm()
{
  USB_RUN="`ifconfig | grep usb0 | grep UP`"
  if [ -z "$USB_RUN" ]
  then
    log "Restart GSM module"
    wb-gsm on
    ifdown usb0
    ifup usb0
  fi
}

while true; do

ping -c 3 -s 100 $P0 -I $IF0 > /dev/null
if [ $? -ne 0 ]; then
  log  "Failed $IF0"
  NEWIF0=0
else
  NEWIF0=1
fi

ping -c 3 -s 100 $P1 -I $IF1 > /dev/null
if [ $? -ne 0 ]; then
  log "Failed $IF1"
  restart_gsm
  NEWIF1=0
else
  NEWIF1=1
fi

if (( ($NEWIF0!=$OLDIF0) || ($NEWIF1!=$OLDIF1) )); then
  if (( ($NEWIF0==1) && ($NEWIF1==1) )); then
  log "Both channels available, use $IF0"
  ip route delete default
  ip route add default via $P0 dev $IF0
  elif (( ($NEWIF0==1) && ($NEWIF1==0) )); then
  log "$IF0 channel"
  ip route delete default
  ip route add default via $P0 dev $IF0
  elif (( ($NEWIF0==0) && ($NEWIF1==1) )); then
  log "$IF1 channel"
  ip route delete default
  ip route add default via $P1 dev $IF1
  fi

else
  log "Not changed"
fi

OLDIF1=$NEWIF1
OLDIF2=$NEWIF2
sleep 30
done
