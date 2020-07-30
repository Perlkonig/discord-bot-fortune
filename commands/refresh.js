var fs = require('fs');
var path = require('path');
const { MessageManager } = require('discord.js');

const dbpath = './db/fortunes';

module.exports = {
	name: 'refresh',
    description: 'Reindexes the fortune files',
    args: false,
    cooldown: 60,
	execute(message, args, globals) {
        message.channel.send("Refreshing quote database. This might take a minute.");

        const delStmt = globals.db.prepare("DELETE FROM quotes WHERE category = ?");
        const addStmt = globals.db.prepare("INSERT INTO quotes (category, quote) VALUES (?, ?)");
        const addDescStmt = globals.db.prepare("INSERT OR IGNORE INTO descriptions (category) VALUES (?)");
        const insertMany = globals.db.transaction((data) => {
            for (const obj of data) addStmt.run(obj);
        });            
        globals.db.prepare("DELETE FROM descriptions WHERE category NOT IN (SELECT DISTINCT(category) FROM quotes)").run();
    
        fs.readdir(dbpath, function (err, files) {
            if (err) {
            console.error("Could not open the `db\\fortunes` folder.", err);
            process.exit(1);
            }
        
            files.forEach(function (file, index) {
                var filepath = path.join(dbpath, file);
    
                fs.stat(filepath, function (error, stat) {
                    if (error) {
                        console.error("Error stating file.", error);
                        return;
                    }
        
                    if (stat.isFile()) {
                        addDescStmt.run(file);
                        delStmt.run(file);
                        message.channel.send("Processing `" + file + "`");
                    
                        var filepath = path.join(dbpath, file);
                        let quotes;
                        try {
                            const f = fs.readFileSync(filepath, 'utf8');
                            quotes = f.split('%\n');
                        } catch (e) {
                            console.error(e);
                            return message.channel.send("Error processing the file: " + e);
                        }
                        message.channel.send("Found " + quotes.length + " quotes");
                        const data = quotes.map(x => [file, x]);
                        insertMany(data);
                    }
                });
            });
        });
	},
};
