ddwrt-bwmon
===========
(This documentation is a work in progress)

A alternative lighter weight solution than WRTBWMon.

The foundations of this tool was rooted in the same needs as WRTBWMon both tools seek to give individual device breakdowns for bandwidth usage and current active download rates per device.

Where WRTBWMon seeks to have tigher integration this tool differs by always trying to be lighter weight on the amount of work your router will have to do. A big part of the difference of this tool is a lot of the functionality previously handled via router sh scripts is now offloaded to html and javascript.

Also since this tool is created later than WRTBWMon we also try and be mobile friendly as much as possible.

![screenshot](https://github.com/vortex-5/ddwrt-bwmon/raw/master/bwmon.png "Screenshot")

Installation instructions
-------------------------
1. Copy the contents of `bwmon` to a persistent storage area of the router. It is recommended to use the automount feature of ddwrt and mount an usb drive to `/opt/`
2. Execute `sh install.sh` (inside the bwmon directory).
3. Set the automount script on the router to point to `/path/bwmon/startup.sh` to autostart this script on mount or just run the startup.sh script manually if you don't wish to start on system bootup.
4. Visit http://your_router_ip/user/bwmon.html

There will be more documentation for specific scenarios as they come and probably an easier install process once this tool leaves it's current alpha state.

Usage and Directory Structure
-----------------------------
All scripts are self contained in the bwmon directory the following lists how you would use each script. None of the scripts require additional parameters and can be executed by direclty calling the script for simplicity. Note all scripts are listed relative to `bwmon/`. 

`startup.sh` | The script that should be run to start the bandwidth monitor note here that the startup script will ensure you don't have multiple versions of bandwidth monitor running so it will kill previous version if they get stuck as well.
`start.sh` | Script used to start the bandwidth monitor manually you should never have to run this startup.sh should take care of this for you.
`stop.sh` | Script to manually stop bandwidth monitoring if you are experiencing issues.
`clean.sh` | This script wipes all the counters and resets all devices back to 0KB of usage.
`install.sh` | Script used only once initially to set all the permissions correctly you can run this again if you're experiencing issues but you should only have to run this once. This will only work on ext4 and ntfs partitions as fat32 lacks chmod ability.
`backup.sh` | This is automatically called to backup the bandwidth stats to persistent storage periodically. If you want to backup immediately it is also safe to execute this whenever the user wishes.
`bwmon-running.sh` | The scripts that control the actual bandwith monitoring process (You should not run this it will be called by the startup scripts).
`bwmon-autobackup.sh` | Sets up the backup script to automatically periodically run in the background.
`www/mac-names.js` | This file contains a user mapping of mac addresses to friendly names. A sample 2 machines are already placed in this file follow the format. Note it's intentional that the final pc name does not end with a comma like every other pc name. Also you will need to run `startup.sh` again after you make your changes for them to appear.
`data/usage.js` | This replaces the old usage.db the file is directly read by the browser's javascript handler and this is how we work out the bandwidth. This is your personal backup if you wish to not lose stats during an upgrade then you should backup and restore this file.
`www` | This is the front end files for the web site these are the pages that your browser uses. These files are copied on startup to the `/tmp/www/` directory so you will need to re-run `startup.sh` in order to see your change if you make them.

Hints and tips
--------------
The yellow highlighting indicates active connections.

If you resize your browser or view from a devices with a smaller screen the cumulative download and upload columns will automatically hide along with the last seen date to better fit the screen space available.