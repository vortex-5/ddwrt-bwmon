ddwrt-bwmon
===========
(This documentation is a work in progress)

A alternative lighter weight solution than WRTBWMon.

The foundations of this tool was rooted in the same needs as WRTBWMon both tools seek to give individual device breakdowns for bandwidth usage and current active download rates per device.

Where WRTBWMon seeks to have tigher integration this tool differs by always trying to be lighter weight on the amount of work your router will have to do. A big part of the difference of this tool is a lot of the functionality previously handled via router sh scripts is now offloaded to html and javascript.

Also since this tool is created later than WRTBWMon we also try and be mobile friendly as much as possible.

Installation instructions
-------------------------
1. Copy the contents of `bwmon` to a persistent storage area of the router. It is recommended to use the automount feature of ddwrt and mount an usb drive to `/opt/`
2. Execute `sh install.sh` (inside the bwmon directory).
3. Set the automount script on the router to point to `/path/bwmon/startup.sh` to autostart this script on mount or just run the startup.sh script manually if you don't wish to start on system bootup.
4. Visit http://your_router_ip/user/bwmon.html

There will be more documentation for specific scenarios as they come and probably an easier install process once this tool leaves it's current alpha state.

![screenshot](https://github.com/vortex-5/ddwrt-bwmon/raw/master/bwmon.png "Screenshot")

Hints and tips
--------------
The yellow highlighting indicates active connections.

If you resize your browser or view from a devices with a smaller screen the cumulative download and upload columns will automatically hide along with the last seen date to better fit the screen space available.