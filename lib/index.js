#!/bin/sh
':' //; export MAX_MEM="--max-old-space-size=60"; exec "$(command -v node || command -v nodejs)" "${NODE_OPTIONS:-$MAX_MEM}" "$0" "$@" 

/*
 * @copyright Copyright (c) Sematext Group, Inc. - All Rights Reserved
 *
 * @licence Sematext Agent for Nginx is free-to-use, proprietary software.
 * THIS IS PROPRIETARY SOURCE CODE OF Sematext Group, Inc. (Sematext)
 * This source code may not be copied, reverse engineered, or altered for any purpose.
 * This source code is to be used exclusively by users and customers of Sematext.
 * Please see the full license (found in LICENSE in this distribution) for details on its license and the licenses of its dependencies.
 */
// this requires are here to compile with enclose.js 
var packageJson = require('../package.json')
var packageJson2 = require('spm-agent/package.json')
if (!process.env.SPM_AGENT_APP_TYPE) {
  // setting the app name for rc configuration module
  // config file will be in /etc/spm-agent-nginx/conf
  // or ./.spm-agent-nginxrc
  process.env.SPM_AGENT_APP_TYPE="sematext-agent-nginx"  
}

var url = require('url')
function NginxMonitor () {
  // config.collectionInterval = 1000
  var SpmAgent = require('spm-agent')
  var osAgent = require ('./osAgent')
  var nginxAgent = require('./nginx-agent')
  console.log('SPM Token: ' + (process.env.SPM_TOKEN || SpmAgent.Config.get('tokens.spm')))
  var nginxUrl = 'http://localhost:80/nginx_status'
  if (SpmAgent.Config.get('nginx.url')) {
    nginxUrl = SpmAgent.Config.get('nginx.url')
    console.log('NGINX url: ' + nginxUrl)
  } else {
    console.error('Missing nginx status url in config ' + SpmAgent.Config.config)
    process.exit(1)
  }
  var njsAgent = new SpmAgent()
  var agentsToLoad = [
      nginxAgent,
      osAgent
  ]
  agentsToLoad.forEach(function (a) {
    try {
      var Monitor = a
      if (a === nginxAgent) {
        var secureUrl = nginxUrl.replace(/:.*@/i, ' ') 
        njsAgent.createAgent(new Monitor(nginxUrl))
      } else {
        njsAgent.createAgent(new Monitor())
      }
    } catch (err) {
      console.log(err)
      SpmAgent.Logger.error('Error loading agent ' + a + ' ' + err)
    }
  })
  return njsAgent
}
NginxMonitor()

process.on('uncaughtException', function (err) {
  console.error((new Date()).toUTCString() + ' uncaughtException:', err.message)
  console.error(err.stack)
  process.exit(1)
})