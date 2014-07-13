/*
 * Server launcher
 */
var fs = require ("fs");
var fork = require ("child_process").fork;

//if module invoked directly, call main
if (require.main === module) {
    main ();
}

/**
 * Load configuration and initiate server launches.
 */
function main () {
    console.log ("Reading configuration from startup.json.");
    // load configuration file, with server startup data
    var configuration = null;
    try {
        var data = fs.readFileSync ("startup.json");
        configuration = JSON.parse (data);
    } catch (e) {
        console.log ("Error loading configuration: " + e.message);
        process.exit (1);
    }
    // start servers
    launchServers (configuration.servers);
}

/**
 * Launch all servers marked with start:true.
 * @param {object} servers List of servers to launch
 */
function launchServers (servers) {
    // for each server in configuration
    for (var ctr = 0; ctr < servers.length; ctr++) {
        var server = servers[ctr];
        // if server marked to start
        if (server.start) {
            // populate port number in args, start child process
            console.log ("Starting " + server.name);
            var args = ["--port=" + server.port];
            fork (server.program + ".js", args, null, startError);
        }
    }
}

/**
 * On error starting a server, display message, terminate program.
 * @param {string} error Error message
 */
function startError (error) {
    console.log ("Error starting server: " + error);
    process.exit (1);
}
