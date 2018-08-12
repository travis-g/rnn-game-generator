const igdb = require('igdb-api-node').default
var fs = require('fs')

// Get API key from process vars so it's not in source
const IGDB_API_KEY = process.env.API_KEY

// Global config object
var g = {
    API_KEY: IGDB_API_KEY,
    DATA: {},
    DUMP_FILE: './igdb-' + new Date().getTime() + '.json',
     // All the metadata fields we'll want. Since we're almost scraping the database,
     // to cut down on the amount of data we have to store we'll trim down the data
     // significantly. If we want things like Summaries, ESRB ratings, thumbnail URLs,
     // etc. we'll have to do another pull.
    FIELDS: [
        "name",
        "first_release_date",
        "genres",
        "platforms",
        "game_modes",
        "themes",
        "developers",
        "publishers"
    ],
    // Metadata is given back as IDs of values for game records: since we have limited
    // 'expand' calls we'll also send requests specifically to dump these values.
    METADATA_ENDPOINTS: [
        "themes", // Mystery, Survival
        "game_modes", // singleplayer, multiplayer, etc.
        "genres", // RPG, Simulator, Indie
        "platforms", // SNES, Xbox, Commodore 64, etc.
        // "companies", // developers/publishers
    ],
    DEFAULT_SCROLL: "&order=name&limit=50",
    LIMIT: 50,
    BASE_URL: 'https://api-endpoint.igdb.com/'
}

// Declare the IGDB client object and set our API key
const client = igdb(IGDB_API_KEY)

// Spark off all metadata requests at once
metadata_promises = g.METADATA_ENDPOINTS.map(function(endpoint) {
    url = '/' + endpoint + '/?fields=id,name' + g.DEFAULT_SCROLL
    // url = endpoint.url + g.DEFAULT_SCROLL
    console.log("Requesting", endpoint, url)
    console.time("request-" + endpoint)
    return client.scrollAll(url).then(function(data) {
        // Middleware so that I can see which request(s) are still running
        console.timeEnd("request-" + endpoint)
        return data
    })
})

// The big one
games_promise = (function() {
    filters = [
        'filter[category][eq]=0', // main games, not expansions/DLCs
        // 'filter[publishers][exists]',
        'filter[game][not_exists]', // not a DLC for a game
        'filter[name][prefix]=Doki', // debug with fewer requests
    ].join('&')
    url = '/games/?fields=' + g.FIELDS.join(',') + '&' +
        filters +
        g.DEFAULT_SCROLL
    console.log("Requesting games", url)
    console.time("request-games")
    return client.scrollAll(url).then(function(data) {
        // Log the time to fetch the full games list
        console.timeEnd("request-games")
        return data
    })
})()

// Combine metadata request results
metadata_marshal = Promise.all(metadata_promises).then(function(combinedResults) {
    data = {}
    combinedResults.map(function(result, index) {
        query = g.METADATA_ENDPOINTS[index]
        data[query] = result
    })
    return data
})

// Combine everything
dump_to_disk = Promise.all([metadata_marshal, games_promise]).then(function(promises_data) {
    data = promises_data[0]
    games_data = promises_data[1]
    data["games"] = games_data
    // Write our massive export to disk
    fs.writeFile(g.DUMP_FILE, JSON.stringify(data, null, 0), function(err) {
        if (err) {
            // Several hundred (thousand) API requests may've been burnt :(
            return console.error("error writing file!")
        }
        console.log("file dumped successfully!")
    })
})
