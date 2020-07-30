module.exports = {
	name: 'describe',
    description: 'Allows you to describe a fortune file',
    args: true,
	execute(message, args, globals) {
        const file = args.shift();
        let row = globals.db.prepare("SELECT COUNT(*) AS count FROM quotes WHERE category=?").get(file);
        if (!row.count) {
            return message.channel.send("That fortune file doesn't appear to exist. Please use the `refresh` command first.");
        }
        if (!args.length) {
            const row = globals.db.prepare("SELECT description FROM descriptions WHERE category=?").get(file);
            if (row.description === null) {
                return message.channel.send("That file is currently not described.");
            } else {
                return message.channel.send("Description:\n" + row.description);
            }
        } else {
            const newDesc = args.join(' ');
            globals.db.prepare("REPLACE INTO descriptions (category, description) VALUES (?, ?)").run(file, newDesc);
            return message.channel.send("Description saved.");
        }
	},
};
